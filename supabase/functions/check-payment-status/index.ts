import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_PAGAMENTO_CONFIRMADO = "https://n8n.srv1084954.hstgr.cloud/webhook/26010f42-aec7-4425-8476-6f052164d7fa";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, cliente_nome, cliente_whatsapp, valor, cupom_usado } = await req.json();
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

    // Se o pagamento foi aprovado, enviar webhook
    if (data.status === "approved" && cliente_nome && cliente_whatsapp) {
      console.log("Payment approved, sending webhook notification...");
      
      try {
        const webhookPayload = {
          tipo: "pagamento_confirmado",
          nome: cliente_nome,
          whatsapp: cliente_whatsapp,
          valor: valor,
          cupom_utilizado: cupom_usado,
          payment_id: data.id,
          status: data.status,
          timestamp: new Date().toISOString(),
        };

        console.log("Webhook payload:", webhookPayload);

        await fetch(WEBHOOK_PAGAMENTO_CONFIRMADO, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log("Payment confirmed webhook sent successfully");
      } catch (webhookError) {
        console.error("Error sending payment confirmed webhook:", webhookError);
        // Não falhar a requisição por causa do webhook
      }
    }

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
