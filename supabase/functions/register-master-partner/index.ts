import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing env vars");
      throw new Error("Server configuration error");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o cadastro está habilitado
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("master_registration_settings")
      .select("id, registration_enabled")
      .single();

    if (settingsError) {
      console.error("Settings error:", settingsError);
      throw new Error("Error checking registration status");
    }

    if (!settings?.registration_enabled) {
      throw new Error("Cadastro de Parceiro Master não está mais disponível");
    }

    // Get partner data
    const { nome, cpf, whatsapp, email, password, coupon_code } = await req.json();

    if (!nome || !cpf || !whatsapp || !email || !password || !coupon_code) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Validar formato do cupom (apenas letras e números, min 3 caracteres)
    const couponLower = coupon_code.toLowerCase().trim();
    if (!/^[a-z0-9]{3,20}$/.test(couponLower)) {
      throw new Error("Cupom deve ter entre 3 e 20 caracteres (apenas letras e números)");
    }

    // Verificar se cupom já existe (incluindo cupons fixos do sistema)
    const systemCoupons = ['cupom10', '10c'];
    if (systemCoupons.includes(couponLower)) {
      throw new Error("Este código de cupom já está em uso");
    }

    // Verificar se cupom já existe na tabela de parceiros
    const { data: existingCoupon } = await supabaseAdmin
      .from("master_partners")
      .select("id")
      .eq("coupon_code", couponLower)
      .maybeSingle();

    if (existingCoupon) {
      throw new Error("Este código de cupom já está em uso");
    }

    // Verificar se CPF já existe
    const { data: existingCpf } = await supabaseAdmin
      .from("master_partners")
      .select("id")
      .eq("cpf", cpf.replace(/\D/g, ''))
      .maybeSingle();

    if (existingCpf) {
      throw new Error("CPF já cadastrado");
    }

    console.log("Creating master partner user...");

    // Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Create user error:", createError);
      if (createError.message.includes("already registered")) {
        throw new Error("Este e-mail já está cadastrado");
      }
      throw new Error(createError.message);
    }

    console.log("User created:", newUser.user.id);

    // Insert master partner record
    const { error: partnerError } = await supabaseAdmin
      .from("master_partners")
      .insert({
        user_id: newUser.user.id,
        nome,
        cpf: cpf.replace(/\D/g, ''),
        whatsapp: whatsapp.replace(/\D/g, ''),
        email,
        coupon_code: couponLower,
      });

    if (partnerError) {
      console.error("Partner insert error:", partnerError);
      // Rollback: delete user if partner insert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Erro ao criar parceiro");
    }

    // Add master_partner role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "master_partner" })
      .eq("user_id", newUser.user.id);

    if (roleError) {
      console.error("Role update error:", roleError);
    }

    // Desabilitar cadastro após primeiro parceiro
    const { error: disableError } = await supabaseAdmin
      .from("master_registration_settings")
      .update({ registration_enabled: false })
      .eq("id", settings.id);

    if (disableError) {
      console.error("Error disabling registration:", disableError);
    }

    console.log("Master partner registered successfully");

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error registering master partner:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
