import { supabase } from "../lib/supabaseClient";
import ProductGrid from "./ProductGrid";

export const revalidate = 0;

// ===== Portada: cambiá estos textos y la foto cuando quieras =====
// Si HERO_IMAGE queda vacío (""), se usa la foto del último producto cargado.
const HERO_IMAGE = "";
const HERO_KICKER = "Nueva colección";
const HERO_TITLE = "Prendas de producción propia";
const HERO_BUTTON = "Ver productos";
// ================================================================

export default async function Home() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error consultando Supabase:", JSON.stringify(error));
  }

  const firstWithPhoto = (products || []).find((p) => (p.image_url || "").trim());
  const heroImg = HERO_IMAGE || (firstWithPhoto ? firstWithPhoto.image_url.split(",")[0].trim() : "");

  return (
    <>
      <header>
        <div className="header-top">
          <div className="logo">
            CRUDO<span>°</span>
          </div>
        </div>
      </header>

      <section className="hero" style={heroImg ? { backgroundImage: `url("${heroImg}")` } : undefined}>
        <div className="hero-content">
          <div className="hero-kicker">{HERO_KICKER}</div>
          <h1 className="hero-title">{HERO_TITLE}</h1>
          <a href="#productos" className="hero-btn">
            {HERO_BUTTON}
          </a>
        </div>
      </section>

      <ProductGrid
        initialProducts={products || []}
        loadError={!!error}
        errorDetail={error ? error.message : null}
      />
    </>
  );
}
