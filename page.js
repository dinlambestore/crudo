import { supabase } from "../lib/supabaseClient";
import ProductGrid from "./ProductGrid";

// Vuelve a pedir los productos cada vez que alguien visita (sin caché vieja)
export const revalidate = 0;

export default async function Home() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    // Esto aparece en Vercel > Logs para poder diagnosticar el problema real
    console.error("Error consultando Supabase:", JSON.stringify(error));
  }

  return (
    <>
      <header>
        <div className="header-top">
          <div className="logo">
            CRUDO<span>°</span>
          </div>
        </div>
      </header>
      <ProductGrid
        initialProducts={products || []}
        loadError={!!error}
        errorDetail={error ? error.message : null}
      />
    </>
  );
}
