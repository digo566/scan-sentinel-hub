import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PartnerLogin } from '@/components/partner/PartnerLogin';
import { PartnerRegister } from '@/components/partner/PartnerRegister';
import { PartnerDashboard } from '@/components/partner/PartnerDashboard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Partner() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [checkingPartner, setCheckingPartner] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to finish loading first
      if (authLoading) {
        return;
      }
      
      if (!user) {
        setIsPartner(false);
        setCheckingPartner(false);
        return;
      }

      console.log('Checking partner status for user:', user.id);
      
      // Add a small delay to ensure session is fully synchronized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: partnerData, error } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Partner check result:', { partnerData, error });
      
      if (error) {
        console.error('Error checking partner status:', error);
      }
      
      setIsPartner(!!partnerData);
      setCheckingPartner(false);
    };

    checkAccess();
  }, [user, authLoading]);

  if (authLoading || checkingPartner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se está logado como parceiro, mostrar dashboard
  if (user && isPartner) {
    return <PartnerDashboard />;
  }

  // Se está logado mas não é parceiro, mostrar mensagem e botão de logout
  if (user && !isPartner) {
    console.log('User logged in but not a partner, user_id:', user.id);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Você não possui uma conta de parceiro associada a este email.
          </p>
          <Button 
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            variant="outline"
          >
            Fazer logout e tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cyber grid background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <PartnerLogin onSwitchToRegister={() => setMode('register')} />
          ) : (
            <PartnerRegister onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}