import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AbandonedSubmission {
  id: string;
  nome: string;
  email: string;
  url: string;
  whatsapp: string;
  payment_status: string | null;
  created_at: string;
}

interface RemarketingTableProps {
  submissions: AbandonedSubmission[];
  onRefresh: () => void;
}

export function RemarketingTable({ submissions, onRefresh }: RemarketingTableProps) {
  const openWhatsApp = (whatsapp: string, nome: string) => {
    const phone = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${nome}! Notamos que você iniciou uma análise de segurança conosco. Posso ajudá-lo a finalizar?`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const getPaymentBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
      cancelled: { label: 'Cancelado', className: 'bg-destructive/20 text-destructive border-destructive/50' },
      rejected: { label: 'Rejeitado', className: 'bg-destructive/20 text-destructive border-destructive/50' },
      expired: { label: 'Expirado', className: 'bg-muted text-muted-foreground border-muted' },
    };
    
    const statusInfo = statusMap[status || 'pending'] || statusMap.pending;
    return <Badge className={`${statusInfo.className} border`}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-orbitron text-lg text-foreground">
          Remarketing - Pagamentos Não Concluídos ({submissions.length})
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
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">WhatsApp</TableHead>
              <TableHead className="text-muted-foreground">URL</TableHead>
              <TableHead className="text-muted-foreground">Status Pagamento</TableHead>
              <TableHead className="text-muted-foreground">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow key={sub.id} className="border-border hover:bg-muted/30">
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sub.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium text-foreground">{sub.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{sub.email}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{sub.whatsapp}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-primary max-w-[150px] truncate block">
                    {sub.url}
                  </span>
                </TableCell>
                <TableCell>{getPaymentBadge(sub.payment_status)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-accent hover:text-accent hover:bg-accent/20"
                    onClick={() => openWhatsApp(sub.whatsapp, sub.nome)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contatar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum lead de remarketing encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
