import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken } from "../../../../lib/adminAuth";

export async function POST(request) {
  let password = "";
  try {
    ({ password } = await request.json());
  } catch (e) {}

  const token = adminToken();
  if (!token) {
    return Response.json({ error: "Falta configurar ADMIN_PASSWORD en Vercel" }, { status: 500 });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
