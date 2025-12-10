import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { Users, LogIn, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartnerLoginProps {
  onSwitchToRegister: () => void;
}

export function PartnerLogin({ onSwitchToRegister }: PartnerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se é um parceiro
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!partnerData) {
        await supabase.auth.signOut();
        toast({
          title: 'Acesso negado',
          description: 'Esta conta não pertence a um parceiro.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });

      window.location.reload();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Erro no login',
        description: error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos' 
          : 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-8 border-glow">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao início
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-secondary" />
        <h2 className="font-orbitron text-2xl text-foreground">
          Área do Parceiro
        </h2>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
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

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm mb-2">
          Ainda não é parceiro?
        </p>
        <Button
          variant="link"
          onClick={onSwitchToRegister}
          className="text-secondary hover:text-secondary/80"
        >
          Cadastre-se como Parceiro
        </Button>
      </div>
    </div>
  );
}