import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ESTADOS = ["pendiente de pago", "pagado", "seña pagada", "entregado", "cancelado"];

export async function GET() {
  if (!isAdmin()) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!supabaseAdmin) {
    return Response.json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel" }, { status: 500 });
  }
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ orders: data });
}

export async function POST(request) {
  if (!isAdmin()) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!supabaseAdmin) return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  const { id, status } = await request.json();
  if (!id || !ESTADOS.includes(status)) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
