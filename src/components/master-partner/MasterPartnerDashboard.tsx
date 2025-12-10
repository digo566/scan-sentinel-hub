import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  LogOut, 
  Tag, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Loader2,
  Eye,
  Copy,
  Users,
  TrendingUp,
  Percent,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PartnerData {
  id: string;
  nome: string;
  coupon_code: string;
}

interface CouponUsage {
  id: string;
  payment_value: number;
  commission_value: number;
  payment_status: 'pending' | 'paid';
  payment_receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
}

interface LinkedPartner {
  id: string;
  nome: string;
  coupon_code: string;
  whatsapp: string;
  created_at: string;
}

interface PartnerSale {
  id: string;
  sale_value: number;
  commission_value: number;
  master_commission_value: number;
  payment_status: string;
  payment_receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
  partner: {
    nome: string;
    coupon_code: string;
  };
  submission: {
    nome: string;
  };
}

export function MasterPartnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [usageData, setUsageData] = useState<CouponUsage[]>([]);
  const [linkedPartners, setLinkedPartners] = useState<LinkedPartner[]>([]);
  const [partnerSales, setPartnerSales] = useState<PartnerSale[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Buscar dados do parceiro master
        const { data: partner, error: partnerError } = await supabase
          .from('master_partners')
          .select('id, nome, coupon_code')
          .eq('user_id', user.id)
          .single();

        if (partnerError) throw partnerError;
        setPartnerData(partner);

        // Buscar uso do cupom do master partner
        const { data: usage, error: usageError } = await supabase
          .from('partner_coupon_usage')
          .select('*')
          .eq('partner_id', partner.id)
          .order('created_at', { ascending: false });

        if (usageError) throw usageError;
        setUsageData(usage || []);

        // Buscar parceiros que se cadastraram com o cupom do master
        const { data: partners, error: partnersError } = await supabase
          .from('partners')
          .select('id, nome, coupon_code, whatsapp, created_at')
          .eq('master_partner_id', partner.id)
          .order('created_at', { ascending: false });

        if (partnersError) throw partnersError;
        setLinkedPartners(partners || []);

        // Buscar vendas dos parceiros vinculados
        if (partners && partners.length > 0) {
          const partnerIds = partners.map(p => p.id);
          const { data: sales, error: salesError } = await supabase
            .from('partner_sales')
            .select(`
              id,
              sale_value,
              commission_value,
              master_commission_value,
              payment_status,
              payment_receipt_url,
              paid_at,
              created_at,
              partner_id,
              submission_id
            `)
            .in('partner_id', partnerIds)
            .order('created_at', { ascending: false });

          if (salesError) throw salesError;

          // Mapear vendas com dados do parceiro
          const salesWithPartners = (sales || []).map(sale => {
            const partnerInfo = partners.find(p => p.id === sale.partner_id);
            return {
              ...sale,
              partner: {
                nome: partnerInfo?.nome || 'Parceiro',
                coupon_code: partnerInfo?.coupon_code || ''
              },
              submission: {
                nome: 'Cliente'
              }
            };
          });

          setPartnerSales(salesWithPartners);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Tente novamente mais tarde',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleCopyCoupon = () => {
    if (partnerData?.coupon_code) {
      navigator.clipboard.writeText(partnerData.coupon_code);
      toast({
        title: 'Cupom copiado!',
        description: 'Compartilhe com seus contatos.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Estatísticas de uso direto do cupom
  const directUsageCount = usageData.length;
  const directPendingAmount = usageData
    .filter((u) => u.payment_status === 'pending')
    .reduce((sum, u) => sum + u.commission_value, 0);
  const directPaidAmount = usageData
    .filter((u) => u.payment_status === 'paid')
    .reduce((sum, u) => sum + u.commission_value, 0);

  // Estatísticas de parceiros vinculados
  const totalLinkedPartners = linkedPartners.length;
  const totalPartnerSales = partnerSales.length;
  const partnerCommissionPending = partnerSales
    .filter((s) => s.payment_status === 'pending')
    .reduce((sum, s) => sum + s.master_commission_value, 0);
  const partnerCommissionPaid = partnerSales
    .filter((s) => s.payment_status === 'paid')
    .reduce((sum, s) => sum + s.master_commission_value, 0);

  // Totais gerais
  const totalPending = directPendingAmount + partnerCommissionPending;
  const totalPaid = directPaidAmount + partnerCommissionPaid;
  const totalEarnings = totalPending + totalPaid;

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

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="font-orbitron text-xl text-foreground">Painel Master Partner</h1>
                <p className="text-sm text-muted-foreground">Olá, {partnerData?.nome}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Cupom Card */}
          <Card className="glass border-glow mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Seu Cupom Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-accent/20 border border-accent/50 rounded-lg px-6 py-3">
                  <span className="font-orbitron text-2xl text-accent">
                    {partnerData?.coupon_code?.toUpperCase()}
                  </span>
                </div>
                <Button variant="outline" onClick={handleCopyCoupon}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground text-sm">
                  <strong>Para clientes:</strong> R$ 5,00 de desconto na análise. Você ganha R$ 10,00 por venda!
                </p>
                <p className="text-muted-foreground text-sm">
                  <strong>Para parceiros:</strong> Cadastro gratuito usando seu cupom. Você ganha R$ 5,00 por venda deles!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards - Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Parceiros Vinculados</p>
                    <p className="font-orbitron text-3xl text-foreground">{totalLinkedPartners}</p>
                  </div>
                  <Users className="w-10 h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Ganhos Totais</p>
                    <p className="font-orbitron text-3xl text-foreground">
                      R$ {totalEarnings.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">A Receber</p>
                    <p className="font-orbitron text-3xl text-accent">
                      R$ {totalPending.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Já Recebido</p>
                    <p className="font-orbitron text-3xl text-primary">
                      R$ {totalPaid.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs para diferentes seções */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 gap-2">
              <TabsTrigger value="overview" className="text-sm">Visão Geral</TabsTrigger>
              <TabsTrigger value="partners" className="text-sm">Parceiros ({totalLinkedPartners})</TabsTrigger>
              <TabsTrigger value="partner-sales" className="text-sm">Vendas Parceiros ({totalPartnerSales})</TabsTrigger>
              <TabsTrigger value="direct-sales" className="text-sm">Vendas Diretas ({directUsageCount})</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card de Comissões Diretas */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="w-5 h-5 text-primary" />
                      Vendas Diretas (Seu Cupom)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cupom utilizado</span>
                        <span className="font-orbitron text-xl">{directUsageCount}x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Comissão por venda</span>
                        <span className="font-orbitron text-xl text-primary">R$ 10,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pendente</span>
                        <span className="font-orbitron text-xl text-accent">
                          R$ {directPendingAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Recebido</span>
                        <span className="font-orbitron text-xl text-primary">
                          R$ {directPaidAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card de Comissões de Parceiros */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-primary" />
                      Vendas dos Parceiros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Parceiros ativos</span>
                        <span className="font-orbitron text-xl">{totalLinkedPartners}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Vendas realizadas</span>
                        <span className="font-orbitron text-xl">{totalPartnerSales}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Comissão por venda</span>
                        <span className="font-orbitron text-xl text-primary">R$ 5,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pendente</span>
                        <span className="font-orbitron text-xl text-accent">
                          R$ {partnerCommissionPending.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Recebido</span>
                        <span className="font-orbitron text-xl text-primary">
                          R$ {partnerCommissionPaid.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lista de Parceiros Vinculados */}
            <TabsContent value="partners">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Parceiros Cadastrados com Seu Cupom
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {linkedPartners.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum parceiro cadastrado ainda. Compartilhe seu cupom para novos parceiros se cadastrarem gratuitamente!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {linkedPartners.map((partner) => {
                        const partnerSalesCount = partnerSales.filter(s => s.partner.coupon_code === partner.coupon_code).length;
                        const partnerEarnings = partnerSales
                          .filter(s => s.partner.coupon_code === partner.coupon_code)
                          .reduce((sum, s) => sum + s.master_commission_value, 0);

                        return (
                          <div
                            key={partner.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                          >
                            <div className="flex-1">
                              <p className="text-foreground font-medium">{partner.nome}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                <span>Cupom: <strong className="text-accent">{partner.coupon_code.toUpperCase()}</strong></span>
                                <span>WhatsApp: {partner.whatsapp}</span>
                                <span>Cadastro: {new Date(partner.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{partnerSalesCount} vendas</p>
                              <p className="font-orbitron text-lg text-primary">
                                R$ {partnerEarnings.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vendas dos Parceiros */}
            <TabsContent value="partner-sales">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary" />
                    Vendas dos Parceiros Vinculados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {partnerSales.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma venda dos parceiros ainda.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {partnerSales.map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex-1">
                            <p className="text-foreground font-medium">
                              Venda do parceiro: {sale.partner.nome}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                              <span>Cupom: <strong className="text-accent">{sale.partner.coupon_code.toUpperCase()}</strong></span>
                              <span>Valor: R$ {sale.sale_value.toFixed(2).replace('.', ',')}</span>
                              <span>Data: {new Date(sale.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Sua comissão</p>
                              <p className="font-orbitron text-lg text-primary">
                                R$ {sale.master_commission_value.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            {sale.payment_status === 'pending' ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : sale.payment_status === 'paid' ? (
                              <>
                                <Badge className="bg-accent text-accent-foreground">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Pago
                                </Badge>
                                {sale.payment_receipt_url && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Comprovante de Pagamento</DialogTitle>
                                      </DialogHeader>
                                      <img
                                        src={sale.payment_receipt_url}
                                        alt="Comprovante"
                                        className="w-full rounded-lg"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="border-destructive text-destructive">
                                Cancelado
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vendas Diretas */}
            <TabsContent value="direct-sales">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Histórico de Vendas Diretas (Seu Cupom)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usageData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma venda direta ainda. Compartilhe seu cupom!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {usageData.map((usage) => (
                        <div
                          key={usage.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                        >
                          <div>
                            <p className="text-foreground font-medium">
                              Comissão: R$ {usage.commission_value.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(usage.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {usage.payment_status === 'pending' ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : (
                              <>
                                <Badge className="bg-accent text-accent-foreground">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Pago
                                </Badge>
                                {usage.payment_receipt_url && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Comprovante de Pagamento</DialogTitle>
                                      </DialogHeader>
                                      <img
                                        src={usage.payment_receipt_url}
                                        alt="Comprovante"
                                        className="w-full rounded-lg"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
