import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PixPaymentProps {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

export function PixPayment({ 
  paymentId, 
  qrCode, 
  qrCodeBase64, 
  onPaymentConfirmed, 
  onCancel 
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>('pending');

  // Auto-check payment status every 5 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { payment_id: paymentId }
        });

        if (error) {
          console.error('Error checking status:', error);
          return;
        }

        console.log('Payment status check:', data);
        setStatus(data.status);

        if (data.status === 'approved') {
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
  }, [paymentId, onPaymentConfirmed]);

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
        body: { payment_id: paymentId }
      });

      if (error) throw error;

      setStatus(data.status);

      if (data.status === 'approved') {
        toast.success('Pagamento confirmado!');
        onPaymentConfirmed();
      } else if (data.status === 'pending') {
        toast.info('Aguardando pagamento...');
      } else {
        toast.error(`Status: ${data.status}`);
      }
    } catch (err) {
      toast.error('Erro ao verificar pagamento');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          Pagamento PIX - R$ 19,90
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
