import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoCheckoutProps {
  preferenceId: string;
  publicKey: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MercadoPagoCheckout({ preferenceId, publicKey, onSuccess, onError }: MercadoPagoCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Carregar o script do Mercado Pago
  useEffect(() => {
    if (window.MercadoPago) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      onError?.('Erro ao carregar SDK do Mercado Pago');
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Não remover o script para evitar recarregar
    };
  }, [onError]);

  // Inicializar o checkout quando o script estiver carregado
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !preferenceId || !publicKey) return;

    try {
      const mp = new window.MercadoPago(publicKey, {
        locale: 'pt-BR',
      });

      // Limpar container antes de renderizar
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      mp.checkout({
        preference: {
          id: preferenceId,
        },
        render: {
          container: containerRef.current,
          label: 'Pagar R$ 19,90',
        },
        autoOpen: true,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      onError?.('Erro ao inicializar pagamento');
      setIsLoading(false);
    }
  }, [scriptLoaded, preferenceId, publicKey, onError]);

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando pagamento...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="cho-container"
        style={{ minHeight: isLoading ? '0' : 'auto' }}
      />
    </div>
  );
}
