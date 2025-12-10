import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PartnerLogin } from '@/components/partner/PartnerLogin';
import { PartnerRegister } from '@/components/partner/PartnerRegister';
import { PartnerDashboard } from '@/components/partner/PartnerDashboard';
import { Loader2 } from 'lucide-react';

export default function Partner() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsPartner(!!partnerData);
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [user]);

  if (loading) {
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

  // Se está logado mas não é parceiro, fazer logout silencioso
  if (user && !isPartner) {
    supabase.auth.signOut();
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