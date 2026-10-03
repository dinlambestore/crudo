"use client";

import { useEffect, useState } from "react";

const ESTADOS = ["pendiente de pago", "pagado", "seña pagada", "entregado", "cancelado"];
const FILTROS = [
  { id: "preparar", label: "Para preparar", estados: ["pagado", "seña pagada"] },
  { id: "entregados", label: "Entregados", estados: ["entregado"] },
  { id: "sinpagar", label: "Sin pagar", estados: ["pendiente de pago", "cancelado"] },
  { id: "todos", label: "Todos", estados: ESTADOS },
];
const COLOR_ESTADO = {
  "pendiente de pago": "#9A948C",
  pagado: "#2E7D4F",
  "seña pagada": "#B7791F",
  entregado: "#1C1C1C",
  cancelado: "#9B2C1F",
};

function fmt(n) {
  return n == null ? "-" : "$" + Number(n).toLocaleString("es-AR");
}

function waLink(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = "549" + d;
  return `https://wa.me/${d}`;
}

const small = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-soft)" };

export default function Admin() {
  const [orders, setOrders] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("preparar");

  async function load() {
    setError("");
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.status === 401) {
      setNeedLogin(true);
      return;
    }
    const data = await res.json();
    if (data.error) setError(data.error);
    setOrders(data.orders || []);
    setNeedLogin(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) load();
    else setError(data.error || "No se pudo entrar");
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setOrders(null);
    setNeedLogin(true);
  }

  async function cambiarEstado(id, status) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "No se pudo guardar el cambio");
      load();
    }
  }

  if (needLogin) {
    return (
      <div style={{ maxWidth: 360, margin: "120px auto", padding: "0 20px", textAlign: "center" }}>
        <div className="logo" style={{ marginBottom: 8 }}>
          CRUDO<span>°</span>
        </div>
        <div style={{ ...small, marginBottom: 28 }}>Panel de pedidos</div>
        <form onSubmit={login}>
          <input
            className="field"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="checkout-btn" type="submit">
            Entrar
          </button>
        </form>
        {error && <p style={{ color: "#9B2C1F", marginTop: 12, fontSize: 13 }}>{error}</p>}
      </div>
    );
  }

  const estadosFiltro = FILTROS.find((f) => f.id === filtro).estados;
  const lista = (orders || []).filter((o) => estadosFiltro.includes(o.status));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div className="logo" style={{ fontSize: 26 }}>
            CRUDO<span>°</span>
          </div>
          <div style={small}>Pedidos</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={load} style={small}>
            Actualizar
          </button>
          <button onClick={logout} style={small}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {FILTROS.map((f) => {
          const n = (orders || []).filter((o) => f.estados.includes(o.status)).length;
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              style={{
                padding: "9px 14px",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                border: "1px solid var(--ink)",
                background: filtro === f.id ? "var(--ink)" : "transparent",
                color: filtro === f.id ? "#fff" : "var(--ink)",
              }}
            >
              {f.label} ({n})
            </button>
          );
        })}
      </div>

      {error && <p style={{ color: "#9B2C1F", marginBottom: 16, fontSize: 13 }}>{error}</p>}
      {orders === null && <p style={small}>Cargando...</p>}
      {orders && lista.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No hay pedidos en esta lista.</p>}

      {lista.map((o) => (
        <div key={o.id} style={{ border: "1px solid var(--line)", padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22 }}>Pedido N° {o.id}</div>
              <div style={small}>
                {new Date(o.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                {o.mode === "sena" ? "Seña" : "Pago total"} · {o.delivery === "envio" ? "Envío" : "Retiro en local"}
              </div>
            </div>
            <select
              value={o.status}
              onChange={(e) => cambiarEstado(o.id, e.target.value)}
              style={{
                padding: "8px 10px",
                fontFamily: "var(--sans)",
                fontSize: 13,
                border: `1px solid ${COLOR_ESTADO[o.status] || "#ccc"}`,
                color: COLOR_ESTADO[o.status] || "inherit",
                background: "#fff",
                height: 38,
              }}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            <div>
              <strong style={{ fontWeight: 500 }}>{o.customer_name}</strong> ·{" "}
              <a href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" style={{ color: "#2E7D4F" }}>
                {o.customer_phone}
              </a>
              {o.customer_email ? ` · ${o.customer_email}` : ""}
            </div>
            {o.address && <div>Dirección: {o.address}</div>}
            {o.notes && <div style={{ color: "var(--ink-soft)" }}>Comentario: {o.notes}</div>}
          </div>

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12, fontSize: 14 }}>
            {(o.items || []).map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>
                  {it.name}
                  {it.color ? ` · ${it.color}` : ""}
                  {it.size ? ` · Talle ${it.size}` : ""} × {it.quantity}
                </span>
                <span>{fmt(it.unit_price * it.quantity)}</span>
              </div>
            ))}
            {Number(o.discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: "#2E7D4F" }}>
                <span>Beneficio mayorista</span>
                <span>-{fmt(o.discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontWeight: 500 }}>
              <span>Total</span>
              <span>{fmt(o.total)}</span>
            </div>
            {o.mode === "sena" && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-soft)" }}>
                <span>Seña {o.amount_paid ? "pagada" : "a pagar"} · Resta cobrar al retirar</span>
                <span>
                  {fmt(o.amount_paid || o.amount_to_pay)} · {fmt(o.total - (o.amount_paid || o.amount_to_pay))}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
