import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_STATE, emailDiizinkan, env, isiIdToken, kembaliSah, siap, tandaTiket } from "@/lib/jembatan";

/** Langkah 2: Google kembali ke sini → cek email → kirim tiket ke panel lokal lewat fragmen URL. */
export async function GET(req: NextRequest) {
  if (!siap()) return new NextResponse("Login belum disiapkan di situs ini.", { status: 404 });

  let simpan: { state?: string; kembali?: string } = {};
  try {
    simpan = JSON.parse(req.cookies.get(COOKIE_STATE)?.value ?? "{}");
  } catch {
    /* cookie rusak: diperlakukan sebagai tidak ada */
  }
  const kembali = kembaliSah(simpan.kembali ?? null);
  const q = req.nextUrl.searchParams;
  if (!kembali || !simpan.state || q.get("state") !== simpan.state) {
    return new NextResponse("Sesi login tidak cocok atau kedaluwarsa. Mulai lagi dari panel lokal.", { status: 400 });
  }

  // Fragmen (#) tidak dikirim ke server mana pun, jadi tiket tidak tercatat di log.
  const ke = (fragmen: string) => {
    const res = NextResponse.redirect(`${kembali}#${fragmen}`);
    res.cookies.delete({ name: COOKIE_STATE, path: "/api/masuk" });
    return res;
  };
  if (q.get("error") || !q.get("code")) return ke("galat=batal");

  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: q.get("code")!,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: `${req.nextUrl.origin}/api/masuk/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tok.ok) return ke("galat=google");
  const { id_token } = (await tok.json()) as { id_token?: string };
  if (!id_token) return ke("galat=google");

  const isi = isiIdToken(id_token);
  const email = String(isi.email ?? "");
  const sah =
    isi.aud === env("GOOGLE_CLIENT_ID") &&
    ["accounts.google.com", "https://accounts.google.com"].includes(String(isi.iss)) &&
    Number(isi.exp) * 1000 > Date.now() &&
    isi.email_verified === true;
  if (!sah) return ke("galat=google");
  if (!emailDiizinkan(email)) return ke("galat=ditolak");

  return ke(`tiket=${tandaTiket(email)}`);
}
