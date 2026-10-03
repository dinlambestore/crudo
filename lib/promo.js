// ===== Beneficio mayorista =====
// Se aplica el descuento si se cumple CUALQUIERA de las dos condiciones:
//   1) Llevar PROMO_MIN_PRENDAS o más unidades del mismo artículo (solo a ese artículo)
//   2) Que la compra supere PROMO_MONTO (a toda la compra)
export const PROMO_MIN_PRENDAS = 5;
export const PROMO_MONTO = 300000;
export const PROMO_DESCUENTO = 0.2; // 0.2 = 20%
// ===============================

export function precioConPromo(price, aplica) {
  return aplica ? Math.round(Number(price) * (1 - PROMO_DESCUENTO)) : Number(price);
}

// lineas: [{ id, price, quantity }]
export function calcularPromo(lineas) {
  const cantPorArticulo = {};
  for (const l of lineas) {
    const key = String(l.id);
    cantPorArticulo[key] = (cantPorArticulo[key] || 0) + Number(l.quantity || 0);
  }
  const subtotal = lineas.reduce((s, l) => s + Number(l.price) * l.quantity, 0);
  const porMonto = subtotal > PROMO_MONTO;
  const aplicaA = (id) => porMonto || (cantPorArticulo[String(id)] || 0) >= PROMO_MIN_PRENDAS;

  const total = lineas.reduce((s, l) => s + precioConPromo(l.price, aplicaA(l.id)) * l.quantity, 0);
  const aplica = lineas.some((l) => aplicaA(l.id));
  const faltaMonto = Math.max(0, PROMO_MONTO - subtotal + 1);
  return { aplica, aplicaA, porMonto, faltaMonto, subtotal, descuento: subtotal - total, total };
}
