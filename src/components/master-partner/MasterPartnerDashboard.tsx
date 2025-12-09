import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  LogOut, 
  Tag, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Loader2,
  Eye,
  Copy
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

export function MasterPartnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [usageData, setUsageData] = useState<CouponUsage[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Buscar dados do parceiro
        const { data: partner, error: partnerError } = await supabase
          .from('master_partners')
          .select('id, nome, coupon_code')
          .eq('user_id', user.id)
          .single();

        if (partnerError) throw partnerError;
        setPartnerData(partner);

        // Buscar uso do cupom
        const { data: usage, error: usageError } = await supabase
          .from('partner_coupon_usage')
          .select('*')
          .eq('partner_id', partner.id)
          .order('created_at', { ascending: false });

        if (usageError) throw usageError;
        setUsageData(usage || []);
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

  const totalUsage = usageData.length;
  const pendingAmount = usageData
    .filter((u) => u.payment_status === 'pending')
    .reduce((sum, u) => sum + u.commission_value, 0);
  const paidAmount = usageData
    .filter((u) => u.payment_status === 'paid')
    .reduce((sum, u) => sum + u.commission_value, 0);

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
                <h1 className="font-orbitron text-xl text-foreground">Painel do Parceiro</h1>
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
                Seu Cupom
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
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
              <p className="text-muted-foreground text-sm mt-3">
                Compartilhe este cupom. Quem usar terá R$ 5,00 de desconto e você ganha R$ 10,00 por venda!
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Cupom Utilizado</p>
                    <p className="font-orbitron text-3xl text-foreground">{totalUsage}x</p>
                  </div>
                  <Tag className="w-10 h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Valor a Receber</p>
                    <p className="font-orbitron text-3xl text-accent">
                      R$ {pendingAmount.toFixed(2).replace('.', ',')}
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
                    <p className="text-muted-foreground text-sm">Valor Recebido</p>
                    <p className="font-orbitron text-3xl text-primary">
                      R$ {paidAmount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage History */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Histórico de Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma comissão ainda. Compartilhe seu cupom!
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
        </main>
      </div>
    </div>
  );
}
