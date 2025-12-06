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
    const { nome, email, url, whatsapp, valor, cupom } = await req.json();
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      throw new Error("Payment configuration error");
    }

    // Valor padrão é 20, com cupom é 10
    const transactionAmount = valor || 20;

    console.log("Creating PIX payment for:", { nome, email, url, valor: transactionAmount, cupom });

    // Create PIX payment using Mercado Pago API
    const paymentData = {
      transaction_amount: transactionAmount,
      description: `Teste de Segurança - SecScan: ${url}`,
      payment_method_id: "pix",
      payer: {
        email: email,
        first_name: nome.split(' ')[0],
        last_name: nome.split(' ').slice(1).join(' ') || nome,
      },
      external_reference: JSON.stringify({
        email,
        url,
        whatsapp,
        cupom: cupom || null,
        valor: transactionAmount,
      }),
    };

    console.log("Payment request data:", JSON.stringify(paymentData));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${Date.now()}-${email}-${url}`,
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log("Mercado Pago response status:", response.status);
    console.log("Mercado Pago response:", responseText);

    if (!response.ok) {
      console.error("Mercado Pago error:", responseText);
      throw new Error(`Failed to create PIX payment: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // Extract PIX data
    const pixData = data.point_of_interaction?.transaction_data;
    
    if (!pixData) {
      console.error("No PIX data in response:", data);
      throw new Error("PIX data not available");
    }

    console.log("PIX payment created successfully:", {
      payment_id: data.id,
      status: data.status,
      valor: transactionAmount,
      cupom: cupom || null,
    });

    return new Response(
      JSON.stringify({ 
        payment_id: data.id,
        status: data.status,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        ticket_url: pixData.ticket_url,
        valor: transactionAmount,
        cupom: cupom || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error creating PIX payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
