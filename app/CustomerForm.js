"use client";

export const emptyCustomer = { name: "", phone: "", email: "", delivery: "retiro", address: "", notes: "" };

export function validateCustomer(c, forceRetiro) {
  if (!c.name || c.name.trim().length < 2) return "Completá tu nombre.";
  if ((c.phone || "").replace(/\D/g, "").length < 8) return "Completá un teléfono válido.";
  if (!forceRetiro && c.delivery === "envio" && (c.address || "").trim().length < 5) return "Completá la dirección de envío.";
  return null;
}

export default function CustomerForm({ value, onChange, forceRetiro }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const delivery = forceRetiro ? "retiro" : value.delivery;

  return (
    <div className="customer-form">
      <div className="form-title">Tus datos</div>
      <input className="field" placeholder="Nombre y apellido" value={value.name} onChange={set("name")} autoComplete="name" />
      <input className="field" placeholder="Teléfono (WhatsApp)" value={value.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
      <input className="field" placeholder="Email (opcional)" value={value.email} onChange={set("email")} inputMode="email" autoComplete="email" />

      {!forceRetiro && (
        <div className="delivery-opts">
          <label className={`delivery-opt ${delivery === "retiro" ? "on" : ""}`}>
            <input type="radio" name="delivery" checked={delivery === "retiro"} onChange={() => onChange({ ...value, delivery: "retiro" })} />
            Retiro en el local
          </label>
          <label className={`delivery-opt ${delivery === "envio" ? "on" : ""}`}>
            <input type="radio" name="delivery" checked={delivery === "envio"} onChange={() => onChange({ ...value, delivery: "envio" })} />
            Envío a domicilio
          </label>
        </div>
      )}

      {delivery === "envio" && (
        <>
          <input className="field" placeholder="Dirección, localidad y código postal" value={value.address} onChange={set("address")} autoComplete="street-address" />
          <div className="form-hint">El costo del envío lo coordinamos por WhatsApp.</div>
        </>
      )}

      <textarea className="field" rows={2} placeholder="Comentarios (opcional)" value={value.notes} onChange={set("notes")} />
    </div>
  );
}
