import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Mercado Pago avisa acá cada vez que cambia un pago.
// Consultamos el pago directamente a Mercado Pago (así nadie puede falsificar el aviso).
export async function POST(request) {
  try {
    const url = new URL(request.url);
    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    const type = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const paymentId =
      (body.data && body.data.id) ||
      url.searchParams.get("data.id") ||
      (type === "payment" ? url.searchParams.get("id") : null);

    if (type !== "payment" || !paymentId || !supabaseAdmin) {
      return new Response("ok");
    }

    const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("No se pudo consultar el pago", paymentId, res.status);
      return new Response("ok");
    }
    const pay = await res.json();
    const orderId = pay.external_reference;
    if (!orderId) return new Response("ok");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, mode, status")
      .eq("id", orderId)
      .single();
    if (!order) return new Response("ok");

    if (pay.status === "approved" && order.status === "pendiente de pago") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: order.mode === "sena" ? "seña pagada" : "pagado",
          amount_paid: pay.transaction_amount,
          mp_payment_id: String(pay.id),
          payer_email: (pay.payer && pay.payer.email) || null,
        })
        .eq("id", order.id);
    }
  } catch (e) {
    console.error("Error en webhook de Mercado Pago:", e.message);
  }
  return new Response("ok");
}

export async function GET() {
  return new Response("ok");
}
