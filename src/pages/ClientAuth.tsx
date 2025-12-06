import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, Mail, Lock, User, Phone, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Validação de senha forte
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Uma letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Um número');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Um caractere especial (!@#$%^&*...)');
  }
  
  return { valid: errors.length === 0, errors };
};

type RecoveryStep = 'email' | 'code' | 'newPassword';

export default function ClientAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Recovery states
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordErrors, setNewPasswordErrors] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [recoveryId, setRecoveryId] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/cliente');
    }
  }, [user, loading, navigate]);

  // Validar senha em tempo real no cadastro
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const { errors } = validatePassword(value);
    setPasswordErrors(errors);
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    const { errors } = validatePassword(value);
    setNewPasswordErrors(errors);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta.',
      });
      navigate('/cliente');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast({
        title: 'Erro no login',
        description: message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senha forte antes de enviar
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      setPasswordErrors(errors);
      toast({
        title: 'Senha fraca',
        description: 'Por favor, crie uma senha mais segura.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/cliente`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
            whatsapp,
          },
        },
      });

      if (error) throw error;

      // Atualizar perfil com nome e whatsapp
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ nome, whatsapp })
          .eq('user_id', data.user.id);
      }

      toast({
        title: 'Conta criada!',
        description: 'Você já pode fazer login.',
      });
      navigate('/cliente');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast({
        title: 'Erro no cadastro',
        description: message === 'User already registered' ? 'Este e-mail já está cadastrado' : message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery Functions
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('request-password-recovery', {
        body: { email: recoveryEmail }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data?.error) throw new Error(data.error);

      // Avançar para o step de código
      setRecoveryStep('code');
      
      toast({
        title: 'Código enviado!',
        description: 'Se o e-mail estiver cadastrado, você receberá um código via WhatsApp.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar recuperação';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('verify-recovery-code', {
        body: { email: recoveryEmail, code: recoveryCode }
      });

      if (response.error) throw response.error;

      const data = response.data;

      if (!data.success) {
        toast({
          title: 'Código inválido',
          description: data.error || 'Verifique o código e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setUserId(data.user_id);
      setRecoveryId(data.recovery_id);
      setRecoveryStep('newPassword');
      toast({
        title: 'Código verificado!',
        description: 'Agora defina sua nova senha.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar código';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senha forte
    const { valid, errors } = validatePassword(newPassword);
    if (!valid) {
      setNewPasswordErrors(errors);
      toast({
        title: 'Senha fraca',
        description: 'Por favor, crie uma senha mais segura.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A confirmação da senha deve ser igual à nova senha.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('reset-password', {
        body: { 
          user_id: userId, 
          recovery_id: recoveryId, 
          new_password: newPassword 
        }
      });

      if (response.error) throw response.error;

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao redefinir senha');
      }

      toast({
        title: 'Senha alterada!',
        description: 'Você já pode fazer login com sua nova senha.',
      });
      
      // Reset recovery state
      setShowRecovery(false);
      setRecoveryStep('email');
      setRecoveryEmail('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmPassword('');
      setUserId('');
      setRecoveryId('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetRecovery = () => {
    setShowRecovery(false);
    setRecoveryStep('email');
    setRecoveryEmail('');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmPassword('');
    setNewPasswordErrors([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password Recovery UI
  if (showRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        
        <Card className="w-full max-w-md glass border-primary/20 relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <KeyRound className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="font-orbitron text-2xl text-foreground">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {recoveryStep === 'email' && 'Digite seu e-mail para receber o código de recuperação'}
              {recoveryStep === 'code' && 'Digite o código de 8 dígitos que você recebeu'}
              {recoveryStep === 'newPassword' && 'Defina sua nova senha'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Step 1: Email */}
            {recoveryStep === 'email' && (
              <form onSubmit={handleRequestRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email" className="text-foreground">E-mail cadastrado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Solicitando...
                    </>
                  ) : (
                    'Solicitar código'
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Code verification */}
            {recoveryStep === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Código de recuperação</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={8}
                      value={recoveryCode}
                      onChange={(value) => setRecoveryCode(value.toUpperCase())}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="bg-input border-border" />
                        <InputOTPSlot index={1} className="bg-input border-border" />
                        <InputOTPSlot index={2} className="bg-input border-border" />
                        <InputOTPSlot index={3} className="bg-input border-border" />
                        <InputOTPSlot index={4} className="bg-input border-border" />
                        <InputOTPSlot index={5} className="bg-input border-border" />
                        <InputOTPSlot index={6} className="bg-input border-border" />
                        <InputOTPSlot index={7} className="bg-input border-border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    O código foi enviado para o seu WhatsApp
                  </p>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || recoveryCode.length !== 8}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRecoveryStep('email')}
                  className="w-full text-muted-foreground"
                >
                  Reenviar código
                </Button>
              </form>
            )}

            {/* Step 3: New password */}
            {recoveryStep === 'newPassword' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="new-password"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={(e) => handleNewPasswordChange(e.target.value)}
                      className={`pl-10 bg-input border-border ${newPasswordErrors.length > 0 && newPassword ? 'border-destructive' : ''}`}
                      required
                      minLength={8}
                    />
                  </div>
                  {newPassword && newPasswordErrors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md p-2 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-destructive space-y-1">
                          <p className="font-medium">A senha precisa ter:</p>
                          <ul className="list-disc list-inside">
                            {newPasswordErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {newPassword && newPasswordErrors.length === 0 && (
                    <p className="text-xs text-accent mt-1">✓ Senha forte</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="confirm-password"
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 bg-input border-border ${confirmPassword && confirmPassword !== newPassword ? 'border-destructive' : ''}`}
                      required
                      minLength={8}
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive mt-1">As senhas não conferem</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && newPassword && (
                    <p className="text-xs text-accent mt-1">✓ Senhas conferem</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || newPasswordErrors.length > 0 || newPassword !== confirmPassword}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando senha...
                    </>
                  ) : (
                    'Alterar senha'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button 
                onClick={resetRecovery}
                className="text-primary hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      <Card className="w-full max-w-md glass border-primary/20 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-orbitron text-2xl text-foreground">
            Área do Cliente
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse sua conta ou crie uma nova
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="login-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
                
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
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome" className="text-foreground">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-whatsapp" className="text-foreground">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-whatsapp"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <PasswordInput
                      id="signup-password"
                      placeholder="Senha forte"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`pl-10 bg-input border-border ${passwordErrors.length > 0 && password ? 'border-destructive' : ''}`}
                      required
                      minLength={8}
                    />
                  </div>
                  {password && passwordErrors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md p-2 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-destructive space-y-1">
                          <p className="font-medium">A senha precisa ter:</p>
                          <ul className="list-disc list-inside">
                            {passwordErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {password && passwordErrors.length === 0 && (
                    <p className="text-xs text-accent mt-1">✓ Senha forte</p>
                  )}
                </div>
                
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
                    'Criar Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-primary hover:underline text-sm">
              ← Voltar para a página inicial
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
