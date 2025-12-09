import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, UserPlus, ArrowLeft, Tag, CheckCircle } from 'lucide-react';

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const whatsappRegex = /^(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Precisa de uma letra maiúscula')
  .regex(/[a-z]/, 'Precisa de uma letra minúscula')
  .regex(/[0-9]/, 'Precisa de um número')
  .regex(/[^A-Za-z0-9]/, 'Precisa de um caractere especial');

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  cpf: z.string().regex(cpfRegex, 'CPF inválido'),
  whatsapp: z.string().regex(whatsappRegex, 'WhatsApp inválido. Use formato: (11) 99999-9999'),
  email: z.string().email('E-mail inválido').max(255, 'E-mail muito longo'),
  password: passwordSchema,
  confirmPassword: z.string(),
  coupon_code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Apenas letras e números'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface MasterPartnerRegisterProps {
  onSwitchToLogin: () => void;
}

export function MasterPartnerRegister({ onSwitchToLogin }: MasterPartnerRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      whatsapp: '',
      email: '',
      password: '',
      confirmPassword: '',
      coupon_code: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('register-master-partner', {
        body: {
          nome: data.nome,
          cpf: data.cpf,
          whatsapp: data.whatsapp,
          email: data.email,
          password: data.password,
          coupon_code: data.coupon_code,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      setIsSuccess(true);
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você pode fazer login agora.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="glass rounded-xl p-8 text-center border-glow">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-orbitron text-2xl text-foreground mb-2">
          Conta Criada!
        </h3>
        <p className="text-muted-foreground mb-6">
          Sua conta de Parceiro Master foi criada com sucesso. Faça login para acessar seu painel.
        </p>
        <Button onClick={onSwitchToLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Fazer Login
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border-glow">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <h2 className="font-orbitron text-2xl text-foreground">
          Cadastro de Parceiro
        </h2>
      </div>

      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6">
        <p className="text-accent text-sm text-center">
          <Tag className="w-4 h-4 inline mr-1" />
          Crie seu cupom exclusivo e ganhe R$ 10,00 por cada venda!
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">E-mail</FormLabel>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Confirmar Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
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
            name="coupon_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Seu Cupom de Desconto
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="meucupom"
                    className="bg-input border-border focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Este cupom dará R$ 5,00 de desconto para quem usar
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Conta de Parceiro
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <Button
          variant="ghost"
          onClick={onSwitchToLogin}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Login
        </Button>
      </div>
    </div>
  );
}
