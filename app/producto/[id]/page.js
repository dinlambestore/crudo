import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import ProductDetail from "./ProductDetail";

export const revalidate = 0;

export default async function ProductoPage({ params }) {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  return (
    <>
      <header>
        <div className="header-top">
          <Link href="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
            CRUDO<span>°</span>
          </Link>
        </div>
      </header>

      {error || !product ? (
        <p style={{ padding: 40 }}>
          No encontramos este producto. <Link href="/">Volver a la tienda</Link>
        </p>
      ) : (
        <ProductDetail product={product} />
      )}
    </>
  );
}
