"use client";

import { useState } from "react";
import Link from "next/link";

const SENA = 15000;

function fmt(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

const ink = "var(--ink, #1C1C1C)";
const line = "var(--line, #E6E2DC)";
const soft = "var(--ink-soft, #7A7570)";

const label = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  marginBottom: 12,
  color: ink,
};

function parseColors(str) {
  return (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes(":")) {
        const [name, hex] = part.split(":").map((x) => x.trim());
        return { name, hex };
      }
      return part.startsWith("#") ? { name: null, hex: part } : { name: part, hex: null };
    });
}

export default function ProductDetail({ product: p }) {
  const images = (p.image_url || "").split(",").map((s) => s.trim()).filter(Boolean);
  const sizes = (p.sizes || "").split(",").map((s) => s.trim()).filter(Boolean);
  const colorList = parseColors(p.colors);
  const colorOpts = colorList.filter((c) => c.name);
  const mainColor = (colorList.find((c) => c.hex) || {}).hex || "#F2F0EC";

  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState(colorOpts.length === 1 ? colorOpts[0].name : null);
  const [qty, setQty] = useState(1);
  const [modo, setModo] = useState("total");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const total = p.price * qty;
  const sena = Math.min(SENA, total);

  async function comprar() {
    if (colorOpts.length > 0 && !color) {
      setMsg("Elegí un color.");
      return;
    }
    if (sizes.length > 0 && !size) {
      setMsg("Elegí un talle.");
      return;
    }
    setMsg("");
    setLoading(true);

    const detalle = `${p.name}${color ? `, color ${color}` : ""}${size ? `, talle ${size}` : ""}, cantidad ${qty}`;
    try {
      localStorage.setItem("crudo_pedido", JSON.stringify({ modo, detalle }));
    } catch (e) {}

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modo, items: [{ id: p.id, size, color, quantity: qty }] }),
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

  const opciones = [
    { id: "total", titulo: "Pagar el total", detalle: fmt(total) },
    {
      id: "sena",
      titulo: "Pagar seña y retirar en el local",
      detalle: `${fmt(sena)} ahora y ${fmt(Math.max(0, total - sena))} al retirar`,
    },
  ];

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 20px 80px" }}>
      <Link
        href="/"
        style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: soft, textDecoration: "none" }}
      >
        ← Volver a la tienda
      </Link>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 56, marginTop: 24 }}>
        <div style={{ flex: "1 1 360px", maxWidth: 580 }}>
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
            {p.tag && <span className="card-tag">{p.tag}</span>}
          </div>

          {images.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  style={{
                    width: 68,
                    height: 90,
                    padding: 0,
                    cursor: "pointer",
                    backgroundImage: `url("${img}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `1px solid ${i === current ? ink : "transparent"}`,
                    opacity: i === current ? 1 : 0.6,
                    transition: "opacity .2s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 320px", maxWidth: 440 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", color: soft }}>
            {p.category}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.15, margin: "10px 0 12px" }}>{p.name}</h1>
          <div style={{ fontSize: 17, fontWeight: 300, letterSpacing: "0.08em", marginBottom: 32 }}>{fmt(p.price)}</div>

          {colorOpts.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={label}>
                Color{color ? <span style={{ color: soft, letterSpacing: "0.1em", textTransform: "none", fontSize: 13 }}> · {color}</span> : null}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {colorOpts.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setColor(c.name);
                      setMsg("");
                    }}
                    aria-label={`Color ${c.name}`}
                    title={c.name}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      padding: 0,
                      cursor: "pointer",
                      background: c.hex || "#ddd",
                      border: "1px solid rgba(0,0,0,0.15)",
                      outline: color === c.name ? `1px solid ${ink}` : "none",
                      outlineOffset: 3,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={label}>Talle</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setMsg("");
                    }}
                    style={{
                      minWidth: 46,
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: "0.1em",
                      border: `1px solid ${size === s ? ink : line}`,
                      background: size === s ? ink : "transparent",
                      color: size === s ? "#fff" : ink,
                      transition: "all .2s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={label}>Cantidad</div>
            <div style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${line}` }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ fontSize: 16, padding: "8px 16px", cursor: "pointer" }} aria-label="Restar">
                −
              </button>
              <span style={{ minWidth: 28, textAlign: "center", fontSize: 14 }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={{ fontSize: 16, padding: "8px 16px", cursor: "pointer" }} aria-label="Sumar">
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={label}>Forma de compra</div>
            {opciones.map((o) => (
              <label
                key={o.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "14px 16px",
                  marginBottom: 8,
                  cursor: "pointer",
                  border: `1px solid ${modo === o.id ? ink : line}`,
                  transition: "border-color .2s",
                }}
              >
                <input
                  type="radio"
                  name="modo"
                  checked={modo === o.id}
                  onChange={() => setModo(o.id)}
                  style={{ marginTop: 3, accentColor: "#1C1C1C" }}
                />
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 400 }}>{o.titulo}</span>
                  <span style={{ fontSize: 12, color: soft }}>{o.detalle}</span>
                </span>
              </label>
            ))}
          </div>

          <button className="checkout-btn" onClick={comprar} disabled={loading}>
            {loading ? "Redirigiendo..." : modo === "sena" ? `Pagar seña de ${fmt(sena)}` : "Comprar con Mercado Pago"}
          </button>
          {msg && <p style={{ color: "#9B2C1F", marginTop: 12, fontSize: 13 }}>{msg}</p>}

          {p.description && (
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${line}` }}>
              <div style={label}>Descripción</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: soft, whiteSpace: "pre-line" }}>{p.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
