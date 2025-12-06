import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  user_id: string;
  recovery_id: string;
  new_password: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Reset password request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, recovery_id, new_password }: ResetRequest = await req.json();
    
    if (!user_id || !recovery_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar senha
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter no mínimo 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying recovery code validity");

    // Verificar se o código de recuperação é válido e não foi usado
    const { data: recoveryData, error: selectError } = await supabase
      .from("password_recovery_codes")
      .select("*")
      .eq("id", recovery_id)
      .eq("user_id", user_id)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (selectError || !recoveryData) {
      console.log("Invalid or expired recovery code");
      return new Response(
        JSON.stringify({ error: "Código de recuperação inválido ou expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Updating user password");

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Erro ao atualizar senha");
    }

    // Marcar código como usado
    await supabase
      .from("password_recovery_codes")
      .update({ used: true })
      .eq("id", recovery_id);

    console.log("Password reset successful");

    return new Response(
      JSON.stringify({ success: true, message: "Senha alterada com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error resetting password:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
