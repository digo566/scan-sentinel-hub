import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Verify recovery code request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, code }: VerifyRequest = await req.json();
    
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "E-mail e código são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying code for email:", email);

    // Buscar código válido
    const { data: recoveryData, error: selectError } = await supabase
      .from("password_recovery_codes")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !recoveryData) {
      console.log("No valid recovery code found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Código expirado ou inválido. Solicite um novo código." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar limite de tentativas
    if (recoveryData.attempts >= recoveryData.max_attempts) {
      console.log("Max attempts reached");
      // Marcar código como usado
      await supabase
        .from("password_recovery_codes")
        .update({ used: true })
        .eq("id", recoveryData.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Limite de tentativas excedido. Solicite um novo código.",
          attempts_exceeded: true
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o código está correto
    if (recoveryData.code !== code.toUpperCase()) {
      console.log("Invalid code, incrementing attempts");
      // Incrementar tentativas
      await supabase
        .from("password_recovery_codes")
        .update({ attempts: recoveryData.attempts + 1 })
        .eq("id", recoveryData.id);

      const remainingAttempts = recoveryData.max_attempts - recoveryData.attempts - 1;
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Código incorreto. ${remainingAttempts} tentativa(s) restante(s).`,
          remaining_attempts: remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Code verified successfully");

    // Código válido - retornar token de reset
    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: recoveryData.user_id,
        recovery_id: recoveryData.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying code:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
