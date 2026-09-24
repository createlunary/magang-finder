import { NextResponse, type NextRequest } from "next/server";
import { acak, COOKIE_STATE, env, kembaliSah, siap } from "@/lib/jembatan";

/** Langkah 1 login panel lokal: simpan state + alamat kembali, lalu ke Google. */
export async function GET(req: NextRequest) {
  if (!siap()) return new NextResponse("Login belum disiapkan di situs ini.", { status: 404 });
  const kembali = kembaliSah(req.nextUrl.searchParams.get("kembali"));
  if (!kembali) return new NextResponse("Alamat kembali harus panel lokal (localhost atau IP jaringan rumah).", { status: 400 });

  const state = acak();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: `${req.nextUrl.origin}/api/masuk/callback`,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(google);
  res.cookies.set(COOKIE_STATE, JSON.stringify({ state, kembali }), {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/masuk",
    maxAge: 600,
  });
  return res;
}
