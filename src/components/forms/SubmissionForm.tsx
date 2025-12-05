import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export function SubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      url: '',
      whatsapp: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Primeiro salva a submissão no banco
      const { error: dbError } = await supabase.from('submissions').insert({
        nome: data.nome,
        email: data.email,
        url: data.url,
        whatsapp: data.whatsapp,
      });

      if (dbError) throw dbError;

      // Cria preferência de pagamento no Mercado Pago
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          nome: data.nome,
          email: data.email,
          url: data.url,
        },
      });

      if (paymentError) throw paymentError;

      // Redireciona para o checkout do Mercado Pago
      if (paymentData?.init_point) {
        window.location.href = paymentData.init_point;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="glass rounded-xl p-8 text-center glow-pulse">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-orbitron text-2xl text-foreground mb-2">
          Solicitação Recebida!
        </h3>
        <p className="text-muted-foreground mb-6">
          Sua aplicação será analisada por nossa equipe. Entraremos em contato se necessário.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Enviar outra URL
        </Button>
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
          💰 Valor: R$ 19,90
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
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar R$ 19,90 e Solicitar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
