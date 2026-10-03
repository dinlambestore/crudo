"use client";

import { useState, useMemo } from "react";
import CustomerForm, { emptyCustomer, validateCustomer } from "./CustomerForm";
import { calcularPromo, PROMO_MIN_PRENDAS, PROMO_DESCUENTO, PROMO_MONTO } from "../lib/promo";

const CATEGORY_LABELS = {
  remeras: "Remeras",
  buzos: "Buzos",
  camperas: "Camperas",
  pantalones: "Pantalones",
  camisas: "Camisas",
  accesorios: "Accesorios",
};

function catLabel(cat) {
  return CATEGORY_LABELS[String(cat || "").toLowerCase()] || cat;
}

function mainHex(str) {
  const parts = (str || "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const hex = part.includes(":") ? part.split(":")[1].trim() : part;
    if (hex.startsWith("#")) return hex;
  }
  return "#F2F0EC";
}

function fmt(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

export default function ProductGrid({ initialProducts, loadError, errorDetail }) {
  const [checkedCats, setCheckedCats] = useState(new Set());
  const [cart, setCart] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [cartMsg, setCartMsg] = useState("");

  const categories = useMemo(() => {
    const set = new Set(initialProducts.map((p) => p.category));
    return [...set];
  }, [initialProducts]);

  const filtered = useMemo(() => {
    if (checkedCats.size === 0) return initialProducts;
    return initialProducts.filter((p) => checkedCats.has(p.category));
  }, [initialProducts, checkedCats]);

  function toggleCat(cat) {
    const next = new Set(checkedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setCheckedCats(next);
  }

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setDrawerOpen(true);
  }

  function changeQty(id, delta) {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  const cartEntries = Object.entries(cart);
  const cartCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const promo = calcularPromo(
    cartEntries
      .map(([id, qty]) => {
        const p = initialProducts.find((pr) => String(pr.id) === String(id));
        return p ? { id: p.id, price: p.price, quantity: qty } : null;
      })
      .filter(Boolean)
  );
  const pct = Math.round(PROMO_DESCUENTO * 100);

  async function goToCheckout() {
    const err = validateCustomer(customer, false);
    if (err) {
      setCartMsg(err);
      return;
    }
    setCartMsg("");
    setCheckoutLoading(true);
    try {
      const items = cartEntries.map(([id, qty]) => ({ id, quantity: qty }));
      const detalle = cartEntries
        .map(([id, qty]) => {
          const p = initialProducts.find((pr) => String(pr.id) === String(id));
          return p ? `${p.name} x${qty}` : null;
        })
        .filter(Boolean)
        .join(", ");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "total", items, customer }),
      });
      const data = await res.json();
      if (data.init_point) {
        try {
          localStorage.setItem(
            "crudo_pedido",
            JSON.stringify({ modo: "total", detalle, delivery: customer.delivery, orderId: data.order_id })
          );
        } catch (e) {}
        window.location.href = data.init_point;
      } else {
        setCartMsg(typeof data.error === "string" ? data.error : "No se pudo iniciar el pago. Probá de nuevo.");
      }
    } catch (e) {
      setCartMsg("Error al iniciar el pago.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <div className="cart-bar">
        <button className="cart-btn" onClick={() => setDrawerOpen(true)} aria-label="Abrir carrito">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M5 8h14l-1 12H6L5 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="cart-label">Carrito</span>
          <span className="cart-count">{cartCount}</span>
        </button>
      </div>

      <div className="shop" id="productos">
        <aside className="filters">
          <div className="filter-group">
            <h3>Categoría</h3>
            {categories.map((cat) => (
              <label className="filter-row" key={cat}>
                <input type="checkbox" checked={checkedCats.has(cat)} onChange={() => toggleCat(cat)} />
                {catLabel(cat)}
              </label>
            ))}
          </div>
        </aside>

        <main>
          {loadError && (
            <p style={{ color: "var(--oxide-dark)", marginBottom: 16 }}>
              No se pudieron cargar los productos. Revisá las variables de Supabase en Vercel.
              {errorDetail && (
                <>
                  <br />
                  Detalle: {errorDetail}
                </>
              )}
            </p>
          )}
          <div className="grid">
            {filtered.map((p) => {
              const mainColor = mainHex(p.colors);
              const images = (p.image_url || "").split(",").map((s) => s.trim()).filter(Boolean);
              const img = hoverId === p.id && images[1] ? images[1] : images[0];
              return (
                <div className="card" key={p.id}>
                  <div
                    className="card-media"
                    onMouseEnter={() => setHoverId(p.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => (window.location.href = `/producto/${p.id}`)}
                    style={{
                      backgroundColor: mainColor,
                      backgroundImage: img ? `url("${img}")` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                    }}
                  >
                    {p.tag && <span className="card-tag">{p.tag}</span>}
                  </div>
                  <div className="card-info">
                    <div className="card-cat">{catLabel(p.category)}</div>
                    <a href={`/producto/${p.id}`} className="card-name" style={{ display: "block", textDecoration: "none" }}>
                      {p.name}
                    </a>
                    <div className="card-price">{fmt(p.price)}</div>
                    <button className="add-btn" onClick={() => addToCart(p.id)}>
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && !loadError && <p>No hay productos cargados todavía.</p>}
          </div>
        </main>
      </div>

      <div className={`overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button onClick={() => setDrawerOpen(false)} style={{ fontSize: 22 }} aria-label="Cerrar carrito">
            ×
          </button>
        </div>
        <div className="drawer-items">
          {cartEntries.length === 0 && <p style={{ padding: "40px 0", color: "var(--ink-soft)" }}>Vacío por ahora.</p>}
          {cartEntries.map(([id, qty]) => {
            const p = initialProducts.find((pr) => String(pr.id) === String(id));
            if (!p) return null;
            return (
              <div className="drawer-item" key={id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 8px" }}>
                    {fmt(p.price)} c/u
                    {promo.aplicaA(p.id) ? (
                      <span style={{ color: "#2E7D4F" }}> · {pct}% OFF</span>
                    ) : (
                      <span> · {PROMO_MIN_PRENDAS - qty} más y tenés precio mayorista</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => changeQty(id, -1)} aria-label="Restar">−</button>
                    <span>{qty}</span>
                    <button onClick={() => changeQty(id, 1)} aria-label="Sumar">+</button>
                  </div>
                </div>
                <div style={{ fontSize: 14 }}>{fmt(p.price * qty)}</div>
              </div>
            );
          })}
          {cartEntries.length > 0 && (
            <div style={{ padding: "20px 0" }}>
              <CustomerForm value={customer} onChange={setCustomer} forceRetiro={false} />
            </div>
          )}
        </div>
        <div className="drawer-foot">
          {promo.aplica ? (
            <>
              <div className="subtotal-row" style={{ marginBottom: 6, color: "var(--ink-soft)" }}>
                <span>Subtotal</span>
                <span>{fmt(promo.subtotal)}</span>
              </div>
              <div className="subtotal-row" style={{ marginBottom: 6, color: "#2E7D4F" }}>
                <span>Beneficio mayorista {pct}%</span>
                <span>-{fmt(promo.descuento)}</span>
              </div>
              <div className="subtotal-row">
                <span>Total</span>
                <span>{fmt(promo.total)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="subtotal-row">
                <span>Total</span>
                <span>{fmt(promo.total)}</span>
              </div>
              {cartCount > 0 && (
                <div className="form-hint" style={{ margin: "-8px 0 14px" }}>
                  Beneficio mayorista: {pct}% OFF llevando {PROMO_MIN_PRENDAS} o más del mismo artículo, o en toda la compra
                  superando {fmt(PROMO_MONTO)} (te faltan {fmt(promo.faltaMonto)}).
                </div>
              )}
            </>
          )}
          <button className="checkout-btn" disabled={cartEntries.length === 0 || checkoutLoading} onClick={goToCheckout}>
            {checkoutLoading ? "Redirigiendo..." : "Pagar con Mercado Pago"}
          </button>
          {cartMsg && <p style={{ color: "#9B2C1F", marginTop: 10, fontSize: 13 }}>{cartMsg}</p>}
        </div>
      </div>
    </>
  );
}
