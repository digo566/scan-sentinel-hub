import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, LogIn, UserPlus } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface MasterPartnerLoginProps {
  onSwitchToRegister: () => void;
  registrationEnabled: boolean;
}

export function MasterPartnerLogin({ onSwitchToRegister, registrationEnabled }: MasterPartnerLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: 'E-mail ou senha incorretos',
          variant: 'destructive',
        });
        return;
      }

      // Recarregar para verificar se é master partner
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao fazer login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-8 border-glow">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <h2 className="font-orbitron text-2xl text-foreground">
          Parceiro Master
        </h2>
      </div>

      <p className="text-muted-foreground mb-6">
        Área exclusiva para parceiros. Faça login para acessar seu painel.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </form>
      </Form>

      {registrationEnabled && (
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-muted-foreground mb-3">
            Ainda não é parceiro?
          </p>
          <Button
            variant="outline"
            onClick={onSwitchToRegister}
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Criar Conta de Parceiro
          </Button>
        </div>
      )}
    </div>
  );
}
