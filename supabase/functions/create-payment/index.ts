import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email, url } = await req.json();
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const preference = {
      items: [
        {
          title: "Teste de Segurança - SecScan",
          description: `Análise de vulnerabilidades para: ${url}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: 19.90,
        },
      ],
      payer: {
        name: nome,
        email: email,
      },
      back_urls: {
        success: `${req.headers.get("origin")}/?payment=success`,
        failure: `${req.headers.get("origin")}/?payment=failure`,
        pending: `${req.headers.get("origin")}/?payment=pending`,
      },
      auto_return: "approved",
      external_reference: `${email}|${url}`,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error("Failed to create payment preference");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        id: data.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
