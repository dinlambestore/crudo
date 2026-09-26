export async function POST(request) {
  const { items } = await request.json();

  if (!items || items.length === 0) {
    return Response.json({ error: "Carrito vacío" }, { status: 400 });
  }

  const accessToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();

  if (!accessToken) {
    console.error("Falta MERCADOPAGO_ACCESS_TOKEN");
    return Response.json({ error: "Falta configurar el token de Mercado Pago" }, { status: 500 });
  }

  const preference = {
    items: items.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: "ARS",
    })),
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
