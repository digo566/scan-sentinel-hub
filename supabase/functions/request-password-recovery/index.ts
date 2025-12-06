import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gerar código de 8 dígitos alfanumérico
function generateRecoveryCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface RecoveryRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Password recovery request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: RecoveryRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Looking up user by email:", email);

    // Buscar usuário pelo email na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nome, whatsapp, email")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      console.log("Profile not found for email:", email);
      // Retornar sucesso mesmo se não encontrar para não revelar se o email existe
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá um código de recuperação." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile found:", profile.user_id);

    // Gerar código de recuperação
    const recoveryCode = generateRecoveryCode();
    console.log("Generated recovery code for user");

    // Salvar código no banco
    const { error: insertError } = await supabase
      .from("password_recovery_codes")
      .insert({
        user_id: profile.user_id,
        email: email,
        code: recoveryCode,
      });

    if (insertError) {
      console.error("Error inserting recovery code:", insertError);
      throw new Error("Erro ao gerar código de recuperação");
    }

    // Enviar webhook com as informações
    const webhookUrl = "https://n8n.srv1084954.hstgr.cloud/webhook/c272f17c-e9eb-4219-a3b4-a4203ef5e51e";
    
    const webhookPayload = {
      codigo: recoveryCode,
      nome_cliente: profile.nome || "Cliente",
      whatsapp: profile.whatsapp || "",
      email: email,
      timestamp: new Date().toISOString(),
    };

    console.log("Sending webhook notification");

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });
      console.log("Webhook response status:", webhookResponse.status);
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Continuar mesmo se o webhook falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Se o e-mail existir, você receberá um código de recuperação." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in password recovery:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
