import type { Metadata } from "next";
import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SplashGate } from "@/components/brand/splash-gate";
import { anton, epilogue } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ДВЖ — твой ритм",
  description:
    "Молодёжная соцсеть локальных активностей, челленджей и объявлений. Врывайся в движ своего района.",
  themeColor: "#FAF4EA",
  icons: {
    icon: "/brand/app-icon-1024.png",
    apple: "/brand/app-icon-1024.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${anton.variable} ${epilogue.variable} h-full bg-background`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <TooltipProvider>
          <Suspense fallback={children}>
            <SplashGate>{children}</SplashGate>
          </Suspense>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
