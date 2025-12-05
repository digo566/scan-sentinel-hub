import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id } = await req.json();
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!accessToken) {
      throw new Error("Payment configuration error");
    }

    if (!payment_id) {
      throw new Error("Payment ID is required");
    }

    console.log("Checking payment status for:", payment_id);

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error("Failed to check payment status");
    }

    const data = await response.json();
    
    console.log("Payment status:", {
      payment_id: data.id,
      status: data.status,
      status_detail: data.status_detail,
    });

    return new Response(
      JSON.stringify({ 
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error checking payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
