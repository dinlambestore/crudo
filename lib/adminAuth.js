import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "crudo_admin";

export function adminToken() {
  const pass = process.env.ADMIN_PASSWORD || "";
  if (!pass) return null;
  return crypto.createHash("sha256").update("crudo:" + pass).digest("hex");
}

export function isAdmin() {
  const t = adminToken();
  if (!t) return false;
  return cookies().get(ADMIN_COOKIE)?.value === t;
}
