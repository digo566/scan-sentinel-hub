import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { nome, whatsapp, cpf, pixKey, couponCode, email, password, masterCoupon, paymentId } = await req.json();

    console.log('Partner registration request:', { nome, email, couponCode, masterCoupon, paymentId });

    // Validações básicas
    if (!nome || nome.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nome deve ter no mínimo 2 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pixKey || pixKey.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Chave PIX inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!couponCode || couponCode.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Código do cupom deve ter no mínimo 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar senha (mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se CPF já existe
    const { data: existingCpf } = await supabase
      .from('partners')
      .select('id')
      .eq('cpf', cpf.replace(/\D/g, ''))
      .maybeSingle();

    if (existingCpf) {
      return new Response(
        JSON.stringify({ error: 'CPF já cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se cupom já existe
    const couponLower = couponCode.toLowerCase().trim();
    const masterCouponLower = masterCoupon?.toLowerCase().trim();
    
    // Verificar se o parceiro está tentando usar o cupom do master como seu próprio cupom
    if (masterCouponLower && couponLower === masterCouponLower) {
      return new Response(
        JSON.stringify({ error: 'Você não pode usar o cupom do Parceiro Master como seu próprio cupom. Crie um código único para você.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: existingCoupon } = await supabase
      .from('partners')
      .select('id')
      .eq('coupon_code', couponLower)
      .maybeSingle();

    if (existingCoupon) {
      return new Response(
        JSON.stringify({ error: 'Este código de cupom já está em uso por outro parceiro' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se não conflita com cupom de master partner
    const { data: existingMasterCoupon } = await supabase
      .from('master_partners')
      .select('id')
      .eq('coupon_code', couponLower)
      .maybeSingle();

    if (existingMasterCoupon) {
      return new Response(
        JSON.stringify({ error: 'Este código de cupom já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cupons fixos do sistema
    const cuponsFixos = ['cupom10', '10c'];
    if (cuponsFixos.includes(couponLower)) {
      return new Response(
        JSON.stringify({ error: 'Este código de cupom não pode ser utilizado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cupom de master partner (se fornecido)
    let masterPartnerId: string | null = null;
    
    if (masterCoupon) {
      const { data: masterPartner } = await supabase
        .from('master_partners')
        .select('id')
        .eq('coupon_code', masterCoupon.toLowerCase().trim())
        .maybeSingle();

      if (!masterPartner) {
        return new Response(
          JSON.stringify({ error: 'Cupom de Parceiro Master inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      masterPartnerId = masterPartner.id;
      console.log('Master partner found:', masterPartnerId);
    } else {
      // Sem cupom de master, precisa de pagamento
      if (!paymentId) {
        return new Response(
          JSON.stringify({ error: 'Pagamento é obrigatório para registro sem cupom de Parceiro Master' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se o pagamento foi aprovado no Mercado Pago
      const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
        },
      });

      const paymentData = await paymentResponse.json();
      console.log('Payment status:', paymentData.status);

      if (paymentData.status !== 'approved') {
        return new Response(
          JSON.stringify({ error: 'Pagamento não foi confirmado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já está cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;
    console.log('User created:', userId);

    // Inserir parceiro
    const { error: partnerError } = await supabase
      .from('partners')
      .insert({
        user_id: userId,
        nome,
        whatsapp: whatsapp.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, ''),
        pix_key: pixKey,
        coupon_code: couponLower,
        master_partner_id: masterPartnerId,
      });

    if (partnerError) {
      console.error('Partner insert error:', partnerError);
      // Remover usuário se falhar a inserção do parceiro
      await supabase.auth.admin.deleteUser(userId);
      throw partnerError;
    }

    console.log('Partner registered successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Parceiro cadastrado com sucesso',
        usedMasterCoupon: !!masterPartnerId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error registering partner:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao cadastrar parceiro. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});