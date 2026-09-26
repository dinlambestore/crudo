export async function POST(request) {
  const { items } = await request.json();

  if (!items || items.length === 0) {
    return Response.json({ error: "Carrito vacío" }, { status: 400 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  const data = await mpRes.json();

  if (!mpRes.ok) {
    return Response.json({ error: data }, { status: 500 });
  }

  return Response.json({ init_point: data.init_point });
}
