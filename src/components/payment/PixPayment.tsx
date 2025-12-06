import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, QrCode, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PixPaymentProps {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  valor: number;
  cupomUsado: boolean;
  cupomNome: string;
  clienteNome: string;
  clienteWhatsapp: string;
  clienteUrl: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

// PIX expira em 30 minutos (1800 segundos)
const PIX_EXPIRATION_SECONDS = 30 * 60;

export function PixPayment({ 
  paymentId, 
  qrCode, 
  qrCodeBase64, 
  valor,
  cupomUsado,
  cupomNome,
  clienteNome,
  clienteWhatsapp,
  clienteUrl,
  onPaymentConfirmed, 
  onCancel 
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [timeLeft, setTimeLeft] = useState(PIX_EXPIRATION_SECONDS);
  const [expired, setExpired] = useState(false);
  const webhookSentRef = useRef(false);

  // Timer de expiração
  useEffect(() => {
    if (expired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expired]);

  // Enviar webhook quando expirar
  useEffect(() => {
    if (expired && !webhookSentRef.current) {
      webhookSentRef.current = true;
      sendExpiredWebhook();
    }
  }, [expired]);

  const sendExpiredWebhook = async () => {
    try {
      console.log('Sending expired payment webhook...');
      
      await fetch('https://n8n.srv1084954.hstgr.cloud/webhook/3e6fcfc9-eedf-4275-81f2-f71de04856c1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          tipo: 'pagamento_expirado',
          nome: clienteNome,
          whatsapp: clienteWhatsapp,
          url: clienteUrl,
          valor: valor,
          cupom_utilizado: cupomUsado,
          cupom_nome: cupomNome,
          payment_id: paymentId,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('Expired payment webhook sent successfully');
    } catch (error) {
      console.error('Error sending expired webhook:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ref para evitar envio duplo do webhook de confirmação
  const paymentConfirmedRef = useRef(false);

  // Auto-check payment status every 5 seconds
  useEffect(() => {
    if (expired) return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { 
            payment_id: paymentId,
            cliente_nome: clienteNome,
            cliente_whatsapp: clienteWhatsapp,
            cliente_url: clienteUrl,
            valor: valor,
            cupom_usado: cupomUsado,
            cupom_nome: cupomNome
          }
        });

        if (error) {
          console.error('Error checking status:', error);
          return;
        }

        console.log('Payment status check:', data);
        setStatus(data.status);

        if (data.status === 'approved' && !paymentConfirmedRef.current) {
          paymentConfirmedRef.current = true;
          toast.success('Pagamento confirmado!');
          onPaymentConfirmed();
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [paymentId, onPaymentConfirmed, expired, clienteNome, clienteWhatsapp, valor, cupomUsado]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  const manualCheckStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { 
          payment_id: paymentId,
          cliente_nome: clienteNome,
          cliente_whatsapp: clienteWhatsapp,
          cliente_url: clienteUrl,
          valor: valor,
          cupom_usado: cupomUsado,
          cupom_nome: cupomNome
        }
      });

      if (error) throw error;

      setStatus(data.status);

      if (data.status === 'approved' && !paymentConfirmedRef.current) {
        paymentConfirmedRef.current = true;
        toast.success('Pagamento confirmado!');
        onPaymentConfirmed();
      } else if (data.status === 'pending') {
        toast.info('Aguardando pagamento...');
      } else if (data.status !== 'approved') {
        toast.error(`Status: ${data.status}`);
      }
    } catch (err) {
      toast.error('Erro ao verificar pagamento');
    } finally {
      setChecking(false);
    }
  };

  // Tela de expirado
  if (expired) {
    return (
      <Card className="border-destructive/30 bg-card/50 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            Pagamento Expirado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              O tempo para pagamento expirou. Não se preocupe, você pode gerar uma nova cobrança.
            </p>
            <p className="text-sm text-muted-foreground">
              Nossa equipe pode entrar em contato para ajudá-lo.
            </p>
          </div>

          <Button
            onClick={onCancel}
            className="w-full"
          >
            Gerar Nova Cobrança
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          Pagamento PIX - R$ {valor},00
        </CardTitle>
        {cupomUsado && (
          <p className="text-accent text-sm">Cupom de desconto aplicado!</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Tempo restante:</p>
          <p className={`text-2xl font-mono font-bold ${
            timeLeft < 300 ? 'text-destructive' : 'text-foreground'
          }`}>
            {formatTime(timeLeft)}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <img 
              src={`data:image/png;base64,${qrCodeBase64}`} 
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Copy code button */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Ou copie o código PIX:
          </p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted/50 rounded-lg text-xs font-mono break-all max-h-20 overflow-y-auto">
              {qrCode}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            status === 'approved' ? 'bg-green-500' : 
            status === 'pending' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} />
          <span className="text-muted-foreground">
            {status === 'approved' ? 'Pagamento confirmado' : 
             status === 'pending' ? 'Aguardando pagamento...' : 
             `Status: ${status}`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={manualCheckStatus}
            disabled={checking}
            className="flex-1"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Verificar Pagamento
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          O status do pagamento é verificado automaticamente a cada 5 segundos.
        </p>
      </CardContent>
    </Card>
  );
}
