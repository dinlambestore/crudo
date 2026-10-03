import { createClient } from "@supabase/supabase-js";

// Cliente con permisos completos. SOLO se usa en el servidor (rutas /api).
// Necesita la variable SUPABASE_SERVICE_ROLE_KEY en Vercel.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
