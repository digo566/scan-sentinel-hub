import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut, Loader2, ExternalLink, Plus, Clock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { SubmissionForm } from '@/components/forms/SubmissionForm';

type Submission = Tables<'submissions'>;

const statusAnaliseColors = {
  pendente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  seguro: 'bg-green-500/20 text-green-400 border-green-500/30',
  vulneravel: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusAnaliseLabels = {
  pendente: 'Pendente',
  seguro: 'Seguro',
  vulneravel: 'Vulnerável',
};

const statusAnaliseIcons = {
  pendente: Clock,
  seguro: CheckCircle,
  vulneravel: AlertTriangle,
};

export default function ClientDashboard() {
  const { user, loading, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState<{ nome: string | null }>({ nome: null });
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user!.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Buscar submissions do usuário
      const { data: submissionsData, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Até logo!',
    });
    navigate('/');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-orbitron text-xl text-foreground">SecScan</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden sm:block">
              Olá, {profile.nome || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {showForm ? (
          <div className="max-w-xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos pedidos
            </Button>
            <SubmissionForm onSuccess={() => {
              setShowForm(false);
              fetchData();
            }} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-orbitron text-3xl text-foreground mb-2">
                  Meus Pedidos
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe o status das suas análises de segurança
                </p>
              </div>
              
              <Button
                onClick={() => setShowForm(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Análise
              </Button>
            </div>

            {submissions.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-orbitron text-xl text-foreground mb-2">
                    Nenhum pedido ainda
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Você ainda não solicitou nenhuma análise de segurança.
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Solicitar Análise
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission) => {
                  const StatusIcon = statusAnaliseIcons[submission.status_analise];
                  return (
                    <Card key={submission.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-foreground font-medium truncate">
                              {submission.url}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              Solicitado em {new Date(submission.created_at).toLocaleDateString('pt-BR')}
                            </CardDescription>
                          </div>
                          <Badge className={`${statusAnaliseColors[submission.status_analise]} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusAnaliseLabels[submission.status_analise]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {submission.status_analise === 'pendente' && 'Sua análise está na fila e será processada em breve.'}
                            {submission.status_analise === 'seguro' && 'Nenhuma vulnerabilidade crítica foi encontrada.'}
                            {submission.status_analise === 'vulneravel' && 'Vulnerabilidades foram detectadas. Nossa equipe entrará em contato.'}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(submission.url, '_blank')}
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
