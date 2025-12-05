import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield, CreditCard, CheckCircle, Loader2, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { PixPayment } from '@/components/payment/PixPayment';

const whatsappRegex = /^(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('E-mail inválido').max(255, 'E-mail muito longo'),
  url: z.string().url('URL inválida. Inclua http:// ou https://').max(500, 'URL muito longa'),
  whatsapp: z.string()
    .regex(whatsappRegex, 'WhatsApp inválido. Use formato: (11) 99999-9999')
    .transform(val => val.replace(/\D/g, '')),
});

type FormData = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  onSuccess?: () => void;
}

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      url: '',
      whatsapp: '',
    },
  });

  // Preencher campos se usuário estiver logado
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('nome, email, whatsapp')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          if (data.nome) form.setValue('nome', data.nome);
          if (data.email) form.setValue('email', data.email);
          if (data.whatsapp) form.setValue('whatsapp', data.whatsapp);
        }
      };
      fetchProfile();
    }
  }, [user, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setFormData(data);
    
    try {
      // Cria pagamento PIX no Mercado Pago
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          nome: data.nome,
          email: data.email,
          url: data.url,
        },
      });

      if (paymentError) throw paymentError;

      if (paymentData?.qr_code && paymentData?.qr_code_base64) {
        setPixData({
          paymentId: paymentData.payment_id,
          qrCode: paymentData.qr_code,
          qrCodeBase64: paymentData.qr_code_base64,
        });
        setShowPayment(true);
      } else {
        throw new Error('Dados PIX não disponíveis');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Erro ao criar pagamento',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!formData || !pixData) return;

    try {
      // Salva a submissão no banco apenas após pagamento confirmado
      const { error: dbError } = await supabase.from('submissions').insert({
        nome: formData.nome,
        email: formData.email,
        url: formData.url,
        whatsapp: formData.whatsapp,
        user_id: user?.id || null,
        payment_status: 'approved',
        payment_id: pixData.paymentId,
      });

      if (dbError) throw dbError;

      setIsSuccess(true);
      setShowPayment(false);
      setPixData(null);
      setFormData(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving submission:', error);
      toast({
        title: 'Erro ao salvar solicitação',
        description: 'Pagamento confirmado, mas houve um erro ao salvar. Entre em contato.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
    setPixData(null);
    setFormData(null);
  };

  // Se não estiver logado, exigir login
  if (!user) {
    return (
      <div className="glass rounded-xl p-8 text-center border-glow">
        <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="font-orbitron text-2xl text-foreground mb-2">
          Faça Login para Continuar
        </h3>
        <p className="text-muted-foreground mb-6">
          Você precisa estar cadastrado para solicitar uma análise de segurança.
        </p>
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6">
          <p className="text-accent font-semibold text-center">
            💰 Valor: R$ 19,90
          </p>
        </div>
        <Link to="/auth">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <User className="w-4 h-4 mr-2" />
            Criar Conta / Entrar
          </Button>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="glass rounded-xl p-8 text-center glow-pulse">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-orbitron text-2xl text-foreground mb-2">
          Pagamento Confirmado!
        </h3>
        <p className="text-muted-foreground mb-6">
          Sua solicitação foi registrada com sucesso. Nossa equipe analisará sua aplicação e entrará em contato.
        </p>
        <Button
          onClick={() => {
            setIsSuccess(false);
            form.reset();
          }}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Enviar outra URL
        </Button>
      </div>
    );
  }

  // Mostrar pagamento PIX
  if (showPayment && pixData) {
    return (
      <div className="glass rounded-xl p-8 border-glow">
        <PixPayment
          paymentId={pixData.paymentId}
          qrCode={pixData.qrCode}
          qrCodeBase64={pixData.qrCodeBase64}
          onPaymentConfirmed={handlePaymentConfirmed}
          onCancel={handleCancelPayment}
        />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border-glow">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <h2 className="font-orbitron text-2xl text-foreground">
          Análise de Segurança
        </h2>
      </div>
      
      <p className="text-muted-foreground mb-4">
        Preencha os dados abaixo para solicitar uma análise de vulnerabilidades da sua aplicação.
      </p>
      
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6">
        <p className="text-accent font-semibold text-center">
          💰 Valor: R$ 19,90 (Pagamento via PIX)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome"
                    className="bg-input border-border focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">E-mail de Contato</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-input border-border focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">URL da Aplicação</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://sua-aplicacao.com"
                    className="bg-input border-border focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">WhatsApp</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
                    className="bg-input border-border focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-orbitron glow-pulse"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar R$ 19,90 via PIX
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
