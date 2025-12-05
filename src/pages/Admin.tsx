import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { StatsCards } from '@/components/admin/StatsCards';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, LogOut, Home, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

type AnalysisStatus = 'pendente' | 'seguro' | 'vulneravel';
type ContactStatus = 'pendente' | 'em_contato' | 'resolvido';

interface Submission {
  id: string;
  nome: string;
  email: string;
  url: string;
  whatsapp: string;
  status_analise: AnalysisStatus;
  status_contato: ContactStatus;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<'all' | AnalysisStatus>('all');

  const fetchSubmissions = async () => {
    setLoadingData(true);
    try {
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status_analise', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions((data as Submission[]) || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchSubmissions();
    }
  }, [user, isAdmin, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center cyber-grid">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center cyber-grid p-6">
        <div className="glass rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="font-orbitron text-2xl text-foreground mb-4">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão de administrador para acessar este painel.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: submissions.length,
    pendentes: submissions.filter((s) => s.status_analise === 'pendente').length,
    vulneraveis: submissions.filter((s) => s.status_analise === 'vulneravel').length,
    seguros: submissions.filter((s) => s.status_analise === 'seguro').length,
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Header */}
      <header className="glass border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-orbitron text-xl text-foreground neon-text">
              SecScan Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Site
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <StatsCards {...stats} />

        {/* Filters */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Filtrar por:</span>
          <Select value={filter} onValueChange={(val) => setFilter(val as 'all' | AnalysisStatus)}>
            <SelectTrigger className="w-[180px] bg-input border-border">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="seguro">Seguros</SelectItem>
              <SelectItem value="vulneravel">Vulneráveis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <SubmissionsTable submissions={submissions} onRefresh={fetchSubmissions} />
        )}
      </main>
    </div>
  );
};

export default Admin;
