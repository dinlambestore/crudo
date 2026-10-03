"use client";

import { useEffect, useState } from "react";

const WHATSAPP = "5491168903764";

export default function Gracias() {
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("crudo_pedido");
      if (guardado) setPedido(JSON.parse(guardado));
    } catch (e) {}
  }, []);

  const esSena = pedido?.modo === "sena";
  const mensaje = esSena
    ? `Hola! Pagué la seña por: ${pedido.detalle}. Quiero coordinar el retiro en el local.`
    : `Hola! Hice una compra en la tienda online${pedido ? ` (${pedido.detalle})` : ""} y quiero coordinar la entrega.`;
  const link = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>
        {esSena ? "¡Recibimos tu seña!" : "¡Gracias por tu compra!"}
      </h1>
      <p style={{ color: "var(--ink-soft)" }}>
        {esSena
          ? "Te llegará un correo de Mercado Pago con el comprobante. Escribinos por WhatsApp para coordinar el día de retiro en el local; el resto lo abonás al retirar."
          : "Te llegará un correo de Mercado Pago con el comprobante. Escribinos por WhatsApp para coordinar la entrega."}
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "14px 24px",
          background: "#25D366",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {esSena ? "Coordinar retiro por WhatsApp" : "Escribinos por WhatsApp"}
      </a>
      <div>
        <a href="/" style={{ display: "inline-block", marginTop: 24, fontWeight: 600, color: "var(--oxide-dark)" }}>
          Volver a la tienda
        </a>
      </div>
    </div>
  );
}
