"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import { IS_LOKAL } from "@/lib/mode";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        // Panel lokal: kembali ke tab = muat ulang data yang mungkin diubah perangkat lain.
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: IS_LOKAL } },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!bg-card !text-foreground !border-border !font-mono !text-xs",
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
