/**
 * Token sesi panel lokal (dikeluarkan API lewat POST /auth/tukar). Disimpan di
 * localStorage per perangkat; hanya berlaku di jaringan lokal karena API-nya pun
 * hanya bisa dijangkau dari sana.
 */
const KUNCI = "mf.sesi";

export function ambilToken(): string | null {
  try {
    const raw = localStorage.getItem(KUNCI);
    if (!raw) return null;
    const { token, exp } = JSON.parse(raw) as { token: string; exp: number };
    return exp * 1000 > Date.now() ? token : null;
  } catch {
    return null;
  }
}

export function simpanToken(token: string, exp: number, email: string) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify({ token, exp, email }));
  } catch {
    /* mode privat: sesi hanya bertahan selama halaman terbuka */
  }
}

export function emailSesi(): string | null {
  try {
    return (JSON.parse(localStorage.getItem(KUNCI) ?? "null") as { email?: string } | null)?.email ?? null;
  } catch {
    return null;
  }
}

export function hapusToken() {
  try {
    localStorage.removeItem(KUNCI);
  } catch {
    /* abaikan */
  }
}

/** Dipanggil lapisan API saat server menjawab 401. */
export function keHalamanMasuk() {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/masuk")) return;
  hapusToken();
  window.location.href = `/masuk?lanjut=${encodeURIComponent(window.location.pathname)}`;
}
