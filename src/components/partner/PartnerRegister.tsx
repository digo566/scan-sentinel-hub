import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Loader2, ArrowLeft, Tag, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PartnerPayment } from './PartnerPayment';

interface PartnerRegisterProps {
  onSwitchToLogin: () => void;
}

const REGISTRATION_PRICE = 10;

export function PartnerRegister({ onSwitchToLogin }: PartnerRegisterProps) {
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    pixKey: '',
    email: '',
    password: '',
    confirmPassword: '',
    couponCode: '',
    masterCoupon: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [masterCouponValid, setMasterCouponValid] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { toast } = useToast();

  // Verificar cupom de master partner
  useEffect(() => {
    const checkMasterCoupon = async () => {
      const coupon = formData.masterCoupon.toLowerCase().trim();
      
      if (!coupon) {
        setMasterCouponValid(false);
        return;
      }

      setCheckingCoupon(true);
      
      const { data } = await supabase
        .from('master_partners')
        .select('id')
        .eq('coupon_code', coupon)
        .maybeSingle();

      setMasterCouponValid(!!data);
      setCheckingCoupon(false);
    };

    const debounce = setTimeout(checkMasterCoupon, 300);
    return () => clearTimeout(debounce);
  }, [formData.masterCoupon]);

  const validateForm = () => {
    if (formData.nome.length < 2) {
      toast({ title: 'Nome deve ter no mínimo 2 caracteres', variant: 'destructive' });
      return false;
    }

    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return false;
    }

    if (formData.whatsapp.replace(/\D/g, '').length < 10) {
      toast({ title: 'WhatsApp inválido', variant: 'destructive' });
      return false;
    }

    if (formData.pixKey.length < 3) {
      toast({ title: 'Chave PIX inválida', variant: 'destructive' });
      return false;
    }

    if (formData.couponCode.length < 3) {
      toast({ title: 'Código do cupom deve ter no mínimo 3 caracteres', variant: 'destructive' });
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({ 
        title: 'Senha fraca', 
        description: 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial',
        variant: 'destructive' 
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Se tem cupom de master válido, registrar diretamente
    if (masterCouponValid) {
      await registerPartner();
    } else {
      // Sem cupom, precisa pagar
      await createPayment();
    }
  };

  const createPayment = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          nome: formData.nome,
          email: formData.email,
          url: 'registro-parceiro',
          whatsapp: formData.whatsapp,
          valor: REGISTRATION_PRICE,
          cupom: null,
          descricao: 'Cadastro de Parceiro SecScan',
        },
      });

      if (error) throw error;

      if (data?.qr_code && data?.qr_code_base64) {
        setPixData({
          paymentId: data.payment_id,
          qrCode: data.qr_code,
          qrCodeBase64: data.qr_code_base64,
        });
        setShowPayment(true);
      } else {
        throw new Error('Dados PIX não disponíveis');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Erro ao criar pagamento',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const registerPartner = async (paymentId?: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('register-partner', {
        body: {
          nome: formData.nome,
          whatsapp: formData.whatsapp,
          cpf: formData.cpf,
          pixKey: formData.pixKey,
          couponCode: formData.couponCode,
          email: formData.email,
          password: formData.password,
          masterCoupon: masterCouponValid ? formData.masterCoupon : null,
          paymentId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Erro no cadastro',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setRegistrationSuccess(true);
      toast({
        title: 'Cadastro realizado!',
        description: 'Sua conta de parceiro foi criada com sucesso.',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirmed = async (paymentId: string) => {
    await registerPartner(paymentId);
    setShowPayment(false);
    setPixData(null);
  };

  if (registrationSuccess) {
    return (
      <div className="glass rounded-xl p-8 text-center border-glow">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="font-orbitron text-2xl text-foreground mb-2">
          Cadastro Realizado!
        </h3>
        <p className="text-muted-foreground mb-6">
          Sua conta de parceiro foi criada com sucesso. Agora você pode fazer login.
        </p>
        <Button
          onClick={onSwitchToLogin}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Fazer Login
        </Button>
      </div>
    );
  }

  if (showPayment && pixData) {
    return (
      <div className="glass rounded-xl p-8 border-glow">
        <PartnerPayment
          paymentId={pixData.paymentId}
          qrCode={pixData.qrCode}
          qrCodeBase64={pixData.qrCodeBase64}
          valor={REGISTRATION_PRICE}
          onPaymentConfirmed={handlePaymentConfirmed}
          onCancel={() => {
            setShowPayment(false);
            setPixData(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border-glow">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao início
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-secondary" />
        <h2 className="font-orbitron text-2xl text-foreground">
          Seja um Parceiro
        </h2>
      </div>

      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 mb-6">
        <p className="text-secondary font-semibold text-center">
          💰 Ganhe R$ 5,00 por cada venda com seu cupom!
        </p>
        <p className="text-muted-foreground text-sm text-center mt-1">
          Taxa de cadastro: R$ {REGISTRATION_PRICE.toFixed(2).replace('.', ',')} (grátis com cupom de Parceiro Master)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">Nome Completo</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="(11) 99999-9999"
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="pixKey">Chave PIX (para receber comissões)</Label>
          <Input
            id="pixKey"
            value={formData.pixKey}
            onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="bg-input border-border focus:border-primary"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <PasswordInput
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="bg-input border-border focus:border-primary"
            required
          />
        </div>

        <div>
          <Label htmlFor="couponCode" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Criar seu Cupom de Desconto
          </Label>
          <Input
            id="couponCode"
            value={formData.couponCode}
            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
            placeholder="meucupom"
            className="bg-input border-border focus:border-primary"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Clientes que usarem seu cupom ganham R$ 5,00 de desconto
          </p>
        </div>

        <div>
          <Label htmlFor="masterCoupon" className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Cupom de Parceiro Master (opcional)
          </Label>
          <Input
            id="masterCoupon"
            value={formData.masterCoupon}
            onChange={(e) => setFormData({ ...formData, masterCoupon: e.target.value })}
            placeholder="Código do Parceiro Master"
            className={`bg-input border-border focus:border-primary ${
              masterCouponValid ? 'border-accent text-accent' : ''
            }`}
          />
          {checkingCoupon && (
            <p className="text-xs text-muted-foreground mt-1">Verificando cupom...</p>
          )}
          {masterCouponValid && (
            <p className="text-accent text-sm mt-1">✓ Cupom válido! Cadastro gratuito.</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : masterCouponValid ? (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Gratuitamente
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Pagar R$ {REGISTRATION_PRICE.toFixed(2).replace('.', ',')} e Cadastrar
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm mb-2">
          Já é parceiro?
        </p>
        <Button
          variant="link"
          onClick={onSwitchToLogin}
          className="text-secondary hover:text-secondary/80"
        >
          Fazer Login
        </Button>
      </div>
    </div>
  );
}