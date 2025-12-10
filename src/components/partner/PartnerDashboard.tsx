import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  DollarSign, 
  Ticket, 
  LogOut, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Receipt,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PartnerData {
  id: string;
  nome: string;
  coupon_code: string;
  pix_key: string;
}

interface Sale {
  id: string;
  sale_value: number;
  commission_value: number;
  payment_status: string;
  payment_receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
  submission: {
    nome: string;
    email: string;
  } | null;
}

export function PartnerDashboard() {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Buscar dados do parceiro
        const { data: partnerData } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (partnerData) {
          setPartner(partnerData);

          // Buscar vendas do parceiro
          const { data: salesData } = await supabase
            .from('partner_sales')
            .select(`
              *,
              submission:submissions(nome, email)
            `)
            .eq('partner_id', partnerData.id)
            .order('created_at', { ascending: false });

          setSales(salesData || []);
        }
      } catch (error) {
        console.error('Error fetching partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const copyCoupon = async () => {
    if (!partner) return;
    try {
      await navigator.clipboard.writeText(partner.coupon_code);
      toast({
        title: 'Cupom copiado!',
        description: 'Compartilhe com seus clientes.',
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  // Cálculos
  const totalSales = sales.length;
  const pendingSales = sales.filter(s => s.payment_status === 'pending');
  const paidSales = sales.filter(s => s.payment_status === 'paid');
  const cancelledSales = sales.filter(s => s.payment_status === 'cancelled');
  
  const totalToReceive = pendingSales.reduce((acc, s) => acc + Number(s.commission_value), 0);
  const totalReceived = paidSales.reduce((acc, s) => acc + Number(s.commission_value), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/50 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-secondary" />
            <div>
              <h1 className="font-orbitron text-xl text-foreground">
                Painel do Parceiro
              </h1>
              <p className="text-sm text-muted-foreground">
                Olá, {partner?.nome}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Cupom */}
        <Card className="glass border-secondary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Ticket className="w-5 h-5" />
              Seu Cupom de Desconto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-secondary/10 rounded-lg p-4 text-center">
                <span className="text-2xl font-bold font-orbitron text-secondary uppercase">
                  {partner?.coupon_code}
                </span>
              </div>
              <Button onClick={copyCoupon} variant="outline" className="border-secondary text-secondary">
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Clientes que usarem seu cupom ganham R$ 5,00 de desconto. Você ganha R$ 5,00 por venda!
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Ticket className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usos do Cupom</p>
                  <p className="text-2xl font-bold text-foreground">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    R$ {totalToReceive.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Já Recebido</p>
                  <p className="text-2xl font-bold text-accent">
                    R$ {totalReceived.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão/Venda</p>
                  <p className="text-2xl font-bold text-primary">R$ 5,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de vendas */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {sales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda ainda. Compartilhe seu cupom!
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          sale.payment_status === 'paid' 
                            ? 'bg-accent/10' 
                            : sale.payment_status === 'cancelled'
                            ? 'bg-destructive/10'
                            : 'bg-yellow-500/10'
                        }`}>
                          {sale.payment_status === 'paid' ? (
                            <CheckCircle className="w-5 h-5 text-accent" />
                          ) : sale.payment_status === 'cancelled' ? (
                            <XCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {sale.submission?.nome || 'Cliente'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground font-medium">
                          + R$ {Number(sale.commission_value).toFixed(2).replace('.', ',')}
                        </p>
                        <Badge
                          variant={
                            sale.payment_status === 'paid' 
                              ? 'default' 
                              : sale.payment_status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {sale.payment_status === 'paid' 
                            ? 'Pago' 
                            : sale.payment_status === 'cancelled'
                            ? 'Cancelado'
                            : 'Pendente'}
                        </Badge>
                        {sale.payment_status === 'paid' && sale.payment_receipt_url && (
                          <a
                            href={sale.payment_receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary hover:underline mt-1"
                          >
                            Ver comprovante
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}