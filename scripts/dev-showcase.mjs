// Pratinjau situs showcase secara lokal (port 3001), berdampingan dengan panel di 3000.
// Snapshot dibaca dari public/snapshot.json — buat dengan:
//   C:\Projects\magang-finder> .venv\Scripts\python mf.py showcase --ekspor <folder web>\public\snapshot.json
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NEXT_PUBLIC_MODE: "showcase",
  NEXT_PUBLIC_API_URL: "",
  NEXT_PUBLIC_SNAPSHOT_URL: "/snapshot.json",
  NEXT_DIST_DIR: ".next-showcase",
};
const anak = spawn("npx", ["next", "dev", "-p", "3001"], { env, stdio: "inherit", shell: true });
anak.on("exit", (kode) => process.exit(kode ?? 0));
