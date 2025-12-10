import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Loader2, X, QrCode } from 'lucide-react';

interface PartnerPaymentProps {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  valor: number;
  onPaymentConfirmed: (paymentId: string) => void;
  onCancel: () => void;
}

export function PartnerPayment({
  paymentId,
  qrCode,
  qrCodeBase64,
  valor,
  onPaymentConfirmed,
  onCancel,
}: PartnerPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: 'Tempo expirado',
            description: 'O pagamento expirou. Tente novamente.',
            variant: 'destructive',
          });
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCancel, toast]);

  // Polling para verificar pagamento
  useEffect(() => {
    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { paymentId },
        });

        if (error) throw error;

        if (data?.status === 'approved') {
          toast({
            title: 'Pagamento confirmado!',
            description: 'Processando seu cadastro...',
          });
          onPaymentConfirmed(paymentId);
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    };

    const pollInterval = setInterval(checkPayment, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentId, onPaymentConfirmed, toast]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Cole no seu app de pagamento.',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Tente selecionar e copiar manualmente.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="w-12 h-12 text-secondary mx-auto mb-3" />
        <h3 className="font-orbitron text-xl text-foreground mb-2">
          Pagamento PIX
        </h3>
        <p className="text-muted-foreground">
          Escaneie o QR Code ou copie o código para pagar
        </p>
        <div className="mt-2 text-lg font-bold text-secondary">
          R$ {valor.toFixed(2).replace('.', ',')}
        </div>
      </div>

      {/* Timer */}
      <div className={`text-center text-sm ${timeLeft < 120 ? 'text-destructive' : 'text-muted-foreground'}`}>
        Expira em: {formatTime(timeLeft)}
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

      {/* Código copia e cola */}
      <div>
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Ou copie o código PIX:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={qrCode}
            readOnly
            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground truncate"
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Aguardando pagamento...</span>
      </div>

      {/* Cancelar */}
      <Button
        onClick={onCancel}
        variant="ghost"
        className="w-full text-muted-foreground hover:text-destructive"
      >
        <X className="w-4 h-4 mr-2" />
        Cancelar
      </Button>
    </div>
  );
}