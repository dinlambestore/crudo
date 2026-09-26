export default function Gracias() {
  return (
    <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>¡Gracias por tu compra!</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Te llegará un correo de Mercado Pago con el comprobante. Nos pondremos en contacto para coordinar el envío.
      </p>
      <a href="/" style={{ display: "inline-block", marginTop: 24, fontWeight: 600, color: "var(--oxide-dark)" }}>
        Volver a la tienda
      </a>
    </div>
  );
}
