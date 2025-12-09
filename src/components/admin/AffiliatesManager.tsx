import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, CheckCircle, Clock, Upload, Eye, Tag } from 'lucide-react';

interface MasterPartner {
  id: string;
  nome: string;
  cpf: string;
  whatsapp: string;
  email: string;
  coupon_code: string;
  created_at: string;
}

interface CouponUsage {
  id: string;
  partner_id: string;
  submission_id: string;
  payment_value: number;
  commission_value: number;
  payment_status: 'pending' | 'paid';
  payment_receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export function AffiliatesManager() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<MasterPartner[]>([]);
  const [usageByPartner, setUsageByPartner] = useState<Record<string, CouponUsage[]>>({});
  const [selectedPartner, setSelectedPartner] = useState<MasterPartner | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar parceiros
      const { data: partnersData, error: partnersError } = await supabase
        .from('master_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;
      setPartners(partnersData || []);

      // Buscar uso de cupons
      const { data: usageData, error: usageError } = await supabase
        .from('partner_coupon_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      // Agrupar por parceiro
      const grouped: Record<string, CouponUsage[]> = {};
      (usageData || []).forEach((usage: CouponUsage) => {
        if (!grouped[usage.partner_id]) {
          grouped[usage.partner_id] = [];
        }
        grouped[usage.partner_id].push(usage);
      });
      setUsageByPartner(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAsPaid = async () => {
    if (!receiptUrl || selectedUsages.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione a URL do comprovante',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_coupon_usage')
        .update({
          payment_status: 'paid',
          payment_receipt_url: receiptUrl,
          paid_at: new Date().toISOString(),
        })
        .in('id', selectedUsages);

      if (error) throw error;

      toast({
        title: 'Pagamento registrado!',
        description: `${selectedUsages.length} comissão(ões) marcada(s) como paga(s).`,
      });

      setPaymentDialogOpen(false);
      setSelectedUsages([]);
      setReceiptUrl('');
      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Erro ao registrar pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPartnerStats = (partnerId: string) => {
    const usages = usageByPartner[partnerId] || [];
    const totalUsage = usages.length;
    const pending = usages.filter((u) => u.payment_status === 'pending');
    const paid = usages.filter((u) => u.payment_status === 'paid');
    const pendingAmount = pending.reduce((sum, u) => sum + u.commission_value, 0);
    const paidAmount = paid.reduce((sum, u) => sum + u.commission_value, 0);
    return { totalUsage, pendingAmount, paidAmount, pending };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass border-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Parceiros Master
        </CardTitle>
      </CardHeader>
      <CardContent>
        {partners.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum parceiro cadastrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cupom</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>A Pagar</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const stats = getPartnerStats(partner.id);
                return (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.nome}</p>
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {partner.coupon_code.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{stats.totalUsage}x</TableCell>
                    <TableCell>
                      {stats.pendingAmount > 0 && (
                        <span className="text-yellow-500 font-medium">
                          R$ {stats.pendingAmount.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      {stats.pendingAmount === 0 && '-'}
                    </TableCell>
                    <TableCell>
                      {stats.paidAmount > 0 && (
                        <span className="text-accent font-medium">
                          R$ {stats.paidAmount.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      {stats.paidAmount === 0 && '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.pending.length > 0 && (
                        <Dialog open={paymentDialogOpen && selectedPartner?.id === partner.id} onOpenChange={(open) => {
                          setPaymentDialogOpen(open);
                          if (open) {
                            setSelectedPartner(partner);
                            setSelectedUsages(stats.pending.map((u) => u.id));
                          } else {
                            setSelectedPartner(null);
                            setSelectedUsages([]);
                            setReceiptUrl('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-accent text-accent">
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pagar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Registrar Pagamento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Parceiro</p>
                                <p className="font-medium">{partner.nome}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Comissões pendentes</p>
                                <p className="font-medium text-lg text-accent">
                                  {stats.pending.length}x = R$ {stats.pendingAmount.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="receipt">URL do Comprovante</Label>
                                <Input
                                  id="receipt"
                                  placeholder="https://..."
                                  value={receiptUrl}
                                  onChange={(e) => setReceiptUrl(e.target.value)}
                                  className="bg-input border-border"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Cole a URL da imagem do comprovante de pagamento
                                </p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="ghost" onClick={() => setPaymentDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleMarkAsPaid}
                                disabled={isProcessing || !receiptUrl}
                                className="bg-accent text-accent-foreground"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirmar Pagamento
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
