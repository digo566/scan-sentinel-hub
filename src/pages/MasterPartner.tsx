import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MasterPartnerLogin } from '@/components/master-partner/MasterPartnerLogin';
import { MasterPartnerRegister } from '@/components/master-partner/MasterPartnerRegister';
import { MasterPartnerDashboard } from '@/components/master-partner/MasterPartnerDashboard';
import { Loader2 } from 'lucide-react';

export default function MasterPartner() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMasterPartner, setIsMasterPartner] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      // Verificar se cadastro está habilitado
      const { data: settings } = await supabase
        .from('master_registration_settings')
        .select('registration_enabled')
        .single();
      
      setRegistrationEnabled(settings?.registration_enabled ?? false);

      // Se usuário está logado, verificar se é master partner
      if (user) {
        const { data: partnerData } = await supabase
          .from('master_partners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsMasterPartner(!!partnerData);
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

  // Se está logado como master partner, mostrar dashboard
  if (user && isMasterPartner) {
    return <MasterPartnerDashboard />;
  }

  // Se está logado mas não é master partner, fazer logout silencioso para permitir login como parceiro
  if (user && !isMasterPartner) {
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
            <MasterPartnerLogin 
              onSwitchToRegister={() => setMode('register')}
              registrationEnabled={registrationEnabled}
            />
          ) : (
            <MasterPartnerRegister 
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
