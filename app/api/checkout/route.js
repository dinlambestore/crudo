import { supabase } from "../../../lib/supabaseClient";

const SENA = 15000;

export async function POST(request) {
  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];
  const mode = body.mode === "sena" ? "sena" : "total";

  if (items.length === 0) {
    return Response.json({ error: "Carrito vacío" }, { status: 400 });
  }

  const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();

  if (!accessToken) {
    console.error("Falta MERCADOPAGO_ACCESS_TOKEN");
    return Response.json({ error: "Falta configurar el token de Mercado Pago" }, { status: 500 });
  }

  const ids = items.map((i) => i.id);
  const { data: productos, error: dbError } = await supabase
    .from("products")
    .select("id, name, price, sizes, colors, active")
    .in("id", ids);

  if (dbError) {
    console.error("Error leyendo productos:", JSON.stringify(dbError));
    return Response.json({ error: "No se pudieron leer los productos" }, { status: 500 });
  }

  const lineas = [];
  for (const item of items) {
    const prod = (productos || []).find((pr) => String(pr.id) === String(item.id));
    if (!prod || !prod.active) {
      return Response.json({ error: "Producto no disponible" }, { status: 400 });
    }
    const cantidad = Math.min(20, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    const talles = (prod.sizes || "").split(",").map((s) => s.trim()).filter(Boolean);
    const talle = item.size && talles.includes(item.size) ? item.size : null;
    const colores = (prod.colors || "")
      .split(",")
      .map((s) => s.split(":")[0].trim())
      .filter((s) => s && !s.startsWith("#"));
    const color = item.color && colores.includes(item.color) ? item.color : null;
    lineas.push({
      title: `${prod.name}${color ? ` - ${color}` : ""}${talle ? ` - Talle ${talle}` : ""}`,
      quantity: cantidad,
      unit_price: Number(prod.price),
      currency_id: "ARS",
    });
  }

  const total = lineas.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  const mpItems =
    mode === "sena"
      ? [
          {
            title: `Seña retiro en local: ${lineas.map((l) => `${l.title} x${l.quantity}`).join(", ")}`.slice(0, 250),
            quantity: 1,
            unit_price: Math.min(SENA, total),
            currency_id: "ARS",
          },
        ]
      : lineas;

  const preference = {
    items: mpItems,
    back_urls: {
      success: `${siteUrl}/gracias`,
      failure: `${siteUrl}/`,
      pending: `${siteUrl}/gracias`,
    },
    auto_return: "approved",
  };

  let mpRes;
  let rawText;
  try {
    mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });
    rawText = await mpRes.text();
  } catch (e) {
    console.error("Error de red al llamar a Mercado Pago:", e.message);
    return Response.json({ error: "No se pudo conectar con Mercado Pago" }, { status: 500 });
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error("Respuesta no-JSON de Mercado Pago. Status:", mpRes.status, "Body:", rawText);
    return Response.json(
      { error: `Mercado Pago respondió status ${mpRes.status}: ${rawText.slice(0, 200)}` },
      { status: 500 }
    );
  }

  if (!mpRes.ok) {
    console.error("Mercado Pago devolvió error:", JSON.stringify(data));
    return Response.json({ error: data }, { status: 500 });
  }

  return Response.json({ init_point: data.init_point });
}
