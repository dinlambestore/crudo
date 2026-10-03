"use client";

import { useEffect, useState } from "react";
import CustomerForm, { emptyCustomer, validateCustomer } from "./CustomerForm";
import { readCart, writeCart, lineKey, clearCart } from "./cart";
import { calcularPromo, PROMO_MIN_PRENDAS, PROMO_DESCUENTO, PROMO_MONTO } from "../lib/promo";

const SENA = 15000;

function fmt(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

export default function CartDrawer() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState("total");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const refresh = () => setItems(readCart());
    const abrir = () => {
      refresh();
      setOpen(true);
    };
    refresh();
    window.addEventListener("crudo-cart", refresh);
    window.addEventListener("crudo-cart-open", abrir);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("crudo-cart", refresh);
      window.removeEventListener("crudo-cart-open", abrir);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function changeQty(k, delta) {
    const next = readCart()
      .map((i) => (lineKey(i) === k ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0);
    writeCart(next);
  }

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const promo = calcularPromo(items.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity })));
  const pct = Math.round(PROMO_DESCUENTO * 100);
  const sena = Math.min(SENA, promo.total);

  async function pagar() {
    const err = validateCustomer(customer, modo === "sena");
    if (err) return setMsg(err);
    setMsg("");
    setLoading(true);
    const delivery = modo === "sena" ? "retiro" : customer.delivery;
    const detalle = items
      .map((i) => `${i.name}${i.color ? ` ${i.color}` : ""}${i.size ? ` talle ${i.size}` : ""} x${i.quantity}`)
      .join(", ");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: modo,
          items: items.map((i) => ({ id: i.id, size: i.size, color: i.color, quantity: i.quantity })),
          customer: { ...customer, delivery },
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        try {
          localStorage.setItem("crudo_pedido", JSON.stringify({ modo, detalle, delivery, orderId: data.order_id }));
        } catch (e) {}
        clearCart();
        window.location.href = data.init_point;
      } else {
        setMsg(typeof data.error === "string" ? data.error : "No se pudo iniciar el pago. Probá de nuevo.");
      }
    } catch (e) {
      setMsg("Error al iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="cart-bar">
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Abrir carrito">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M5 8h14l-1 12H6L5 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="cart-label">Carrito</span>
          <span className="cart-count">{count}</span>
        </button>
      </div>

      <div className={`overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button onClick={() => setOpen(false)} style={{ fontSize: 22 }} aria-label="Cerrar carrito">
            ×
          </button>
        </div>

        <div className="drawer-items">
          {items.length === 0 && <p style={{ padding: "40px 0", color: "var(--ink-soft)" }}>Vacío por ahora.</p>}

          {items.map((i) => {
            const k = lineKey(i);
            return (
              <div className="drawer-item" key={k}>
                <div
                  style={{
                    width: 64,
                    height: 84,
                    flexShrink: 0,
                    backgroundColor: "#F2F0EC",
                    backgroundImage: i.image ? `url("${i.image}")` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 8px" }}>
                    {[i.color, i.size ? `Talle ${i.size}` : null].filter(Boolean).join(" · ")}
                    {(i.color || i.size) && " · "}
                    {fmt(i.price)} c/u
                    {promo.aplicaA(i.id) && <span style={{ color: "#2E7D4F" }}> · {pct}% OFF</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => changeQty(k, -1)} aria-label="Restar">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => changeQty(k, 1)} aria-label="Sumar">+</button>
                    <button
                      onClick={() => changeQty(k, -i.quantity)}
                      style={{ marginLeft: "auto", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--ink-soft)" }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length > 0 && (
            <div style={{ padding: "20px 0" }}>
              <div className="form-title">Forma de compra</div>
              <div className="delivery-opts">
                <label className={`delivery-opt ${modo === "total" ? "on" : ""}`}>
                  <input type="radio" name="modo-cart" checked={modo === "total"} onChange={() => setModo("total")} />
                  Pagar el total
                </label>
                <label className={`delivery-opt ${modo === "sena" ? "on" : ""}`}>
                  <input type="radio" name="modo-cart" checked={modo === "sena"} onChange={() => setModo("sena")} />
                  Seña y retiro en local
                </label>
              </div>
              {modo === "sena" && (
                <div className="form-hint">
                  Pagás {fmt(sena)} ahora y {fmt(Math.max(0, promo.total - sena))} al retirar en el local.
                </div>
              )}

              <CustomerForm value={customer} onChange={setCustomer} forceRetiro={modo === "sena"} />
            </div>
          )}
        </div>

        <div className="drawer-foot">
          {promo.aplica && (
            <>
              <div className="subtotal-row" style={{ marginBottom: 6, color: "var(--ink-soft)" }}>
                <span>Subtotal</span>
                <span>{fmt(promo.subtotal)}</span>
              </div>
              <div className="subtotal-row" style={{ marginBottom: 6, color: "#2E7D4F" }}>
                <span>Beneficio mayorista {pct}%</span>
                <span>-{fmt(promo.descuento)}</span>
              </div>
            </>
          )}
          <div className="subtotal-row">
            <span>Total</span>
            <span>{fmt(promo.total)}</span>
          </div>
          {!promo.aplica && count > 0 && (
            <div className="form-hint" style={{ margin: "-8px 0 14px" }}>
              Mayoristas: {pct}% OFF llevando {PROMO_MIN_PRENDAS} o más del mismo artículo, o superando {fmt(PROMO_MONTO)}.
            </div>
          )}
          <button className="checkout-btn" disabled={items.length === 0 || loading} onClick={pagar}>
            {loading ? "Redirigiendo..." : modo === "sena" ? `Pagar seña de ${fmt(sena)}` : "Pagar con Mercado Pago"}
          </button>
          {msg && <p style={{ color: "#9B2C1F", marginTop: 10, fontSize: 13 }}>{msg}</p>}
        </div>
      </div>
    </>
  );
}
