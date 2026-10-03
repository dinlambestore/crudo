"use client";

import { useState, useMemo } from "react";
import CartDrawer from "./CartDrawer";
import { addToCart } from "./cart";

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

function tieneColores(str) {
  return (str || "").split(",").some((s) => s.trim() && !s.trim().startsWith("#"));
}

function fmt(n) {
  return "$" + Number(n).toLocaleString("es-AR");
}

export default function ProductGrid({ initialProducts, loadError, errorDetail }) {
  const [checkedCats, setCheckedCats] = useState(new Set());
  const [hoverId, setHoverId] = useState(null);

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

  function agregar(p) {
    const sizes = (p.sizes || "").split(",").map((s) => s.trim()).filter(Boolean);
    // Si hay que elegir color o talle, lo mandamos a la página del producto
    if (tieneColores(p.colors) || sizes.length > 1) {
      window.location.href = `/producto/${p.id}`;
      return;
    }
    const image = (p.image_url || "").split(",")[0].trim();
    addToCart({ id: p.id, name: p.name, price: p.price, image, quantity: 1, color: null, size: sizes[0] || null });
  }

  return (
    <>
      <CartDrawer />

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
              No se pudieron cargar los productos.
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
              const sizes = (p.sizes || "").split(",").map((s) => s.trim()).filter(Boolean);
              const elegir = tieneColores(p.colors) || sizes.length > 1;
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
                    <button className="add-btn" onClick={() => agregar(p)}>
                      {elegir ? "Elegir opciones" : "Agregar al carrito"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && !loadError && <p>No hay productos cargados todavía.</p>}
          </div>
        </main>
      </div>
    </>
  );
}
