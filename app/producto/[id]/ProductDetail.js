"use client";

import { useState } from "react";
import Link from "next/link";

const SENA = 15000;

function fmt(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

export default function ProductDetail({ product: p }) {
  const images = (p.image_url || "").split(",").map((s) => s.trim()).filter(Boolean);
  const sizes = (p.sizes || "").split(",").map((s) => s.trim()).filter(Boolean);
  const mainColor = (p.colors || "").split(",").filter(Boolean)[0] || "#181510";

  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [modo, setModo] = useState("total");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const total = p.price * qty;
  const sena = Math.min(SENA, total);

  async function comprar() {
    if (sizes.length > 0 && !size) {
      setMsg("Elegí un talle.");
      return;
    }
    setMsg("");
    setLoading(true);

    const detalle = `${p.name}${size ? `, talle ${size}` : ""}, cantidad ${qty}`;
    try {
      localStorage.setItem("crudo_pedido", JSON.stringify({ modo, detalle }));
    } catch (e) {}

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modo, items: [{ id: p.id, size, quantity: qty }] }),
      });
      const data = await res.json();
      if (data.init_point) window.location.href = data.init_point;
      else setMsg("No se pudo iniciar el pago. Probá de nuevo.");
    } catch (e) {
      setMsg("Error al iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  const mainImg = images[current];
  const ink = "var(--ink, #181510)";

  const opciones = [
    { id: "total", titulo: "Pagar el total", detalle: fmt(total) },
    {
      id: "sena",
      titulo: "Pagar seña y retirar en el local",
      detalle: `${fmt(sena)} ahora y ${fmt(Math.max(0, total - sena))} al retirar`,
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}>
      <Link href="/" style={{ fontSize: 14, color: "var(--ink-soft)", textDecoration: "none" }}>
        ← Volver a la tienda
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 40, marginTop: 20 }}>
        <div style={{ flex: "1 1 360px", maxWidth: 560 }}>
          <div
            style={{
              aspectRatio: "3 / 4",
              backgroundColor: mainColor,
              backgroundImage: mainImg ? `url("${mainImg}")` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
          >
            {p.tag && (
              <span className="card-tag" style={{ position: "absolute", top: 12, left: 12 }}>
                {p.tag}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  style={{
                    width: 72,
                    height: 96,
                    padding: 0,
                    cursor: "pointer",
                    backgroundImage: `url("${img}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: i === current ? `2px solid ${ink}` : "1px solid #ddd",
                    opacity: i === current ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <div style={{ fontSize: 13, textTransform: "capitalize", color: "var(--ink-soft)" }}>{p.category}</div>
          <h1 style={{ fontSize: 28, margin: "6px 0 10px" }}>{p.name}</h1>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{fmt(p.price)}</div>

          {sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Talle</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setMsg("");
                    }}
                    style={{
                      minWidth: 48,
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      border: `1px solid ${ink}`,
                      background: size === s ? ink : "transparent",
                      color: size === s ? "#fff" : ink,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Cantidad</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ fontSize: 20, padding: "4px 12px", cursor: "pointer" }}>−</button>
              <span style={{ fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={{ fontSize: 20, padding: "4px 12px", cursor: "pointer" }}>+</button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Forma de compra</div>
            {opciones.map((o) => (
              <label
                key={o.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                  border: modo === o.id ? `2px solid ${ink}` : "1px solid #ddd",
                }}
              >
                <input type="radio" name="modo" checked={modo === o.id} onChange={() => setModo(o.id)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ display: "block", fontWeight: 600 }}>{o.titulo}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{o.detalle}</span>
                </span>
              </label>
            ))}
          </div>

          <button className="checkout-btn" onClick={comprar} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Redirigiendo..." : modo === "sena" ? `Pagar seña de ${fmt(sena)}` : "Comprar con Mercado Pago"}
          </button>
          {msg && <p style={{ color: "#b3261e", marginTop: 10 }}>{msg}</p>}

          {p.description && (
            <div style={{ marginTop: 32, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Descripción</div>
              {p.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
