import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageCircle, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface SubmissionsTableProps {
  submissions: Submission[];
  onRefresh: () => void;
}

export function SubmissionsTable({ submissions, onRefresh }: SubmissionsTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const updateStatus = async (
    id: string,
    field: 'status_analise' | 'status_contato',
    value: string
  ) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O status foi alterado com sucesso.',
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta submissão?')) return;

    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Submissão excluída',
        description: 'A submissão foi removida com sucesso.',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a submissão.',
        variant: 'destructive',
      });
    }
  };

  const openWhatsApp = (whatsapp: string, nome: string) => {
    const phone = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${nome}! Entramos em contato referente à análise de segurança da sua aplicação.`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const getAnalysisBadge = (status: AnalysisStatus) => {
    const variants = {
      pendente: 'status-pendente',
      seguro: 'status-seguro',
      vulneravel: 'status-vulneravel',
    };
    const labels = {
      pendente: 'Pendente',
      seguro: 'Seguro',
      vulneravel: 'Vulnerável',
    };
    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const getContactBadge = (status: ContactStatus) => {
    const variants = {
      pendente: 'bg-muted text-muted-foreground',
      em_contato: 'bg-secondary/20 text-secondary border-secondary/50',
      resolvido: 'bg-accent/20 text-accent border-accent/50',
    };
    const labels = {
      pendente: 'Pendente',
      em_contato: 'Em Contato',
      resolvido: 'Resolvido',
    };
    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-orbitron text-lg text-foreground">
          Submissões ({submissions.length})
        </h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Contato</TableHead>
              <TableHead className="text-muted-foreground">URL</TableHead>
              <TableHead className="text-muted-foreground">Análise</TableHead>
              <TableHead className="text-muted-foreground">Contato</TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow
                key={sub.id}
                className={`border-border hover:bg-muted/30 ${
                  sub.status_analise === 'vulneravel' ? 'bg-destructive/10' : ''
                }`}
              >
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sub.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{sub.nome}</p>
                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-accent hover:text-accent hover:bg-accent/20"
                    onClick={() => openWhatsApp(sub.whatsapp, sub.nome)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {sub.whatsapp}
                  </Button>
                </TableCell>
                <TableCell>
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-sm max-w-[200px] truncate"
                  >
                    {sub.url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </TableCell>
                <TableCell>
                  <Select
                    value={sub.status_analise}
                    onValueChange={(val) => updateStatus(sub.id, 'status_analise', val)}
                    disabled={updating === sub.id}
                  >
                    <SelectTrigger className="w-[130px] bg-input border-border">
                      <SelectValue>{getAnalysisBadge(sub.status_analise)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="seguro">Seguro</SelectItem>
                      <SelectItem value="vulneravel">Vulnerável</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={sub.status_contato}
                    onValueChange={(val) => updateStatus(sub.id, 'status_contato', val)}
                    disabled={updating === sub.id}
                  >
                    <SelectTrigger className="w-[130px] bg-input border-border">
                      <SelectValue>{getContactBadge(sub.status_contato)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_contato">Em Contato</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/20"
                    onClick={() => deleteSubmission(sub.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma submissão encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
