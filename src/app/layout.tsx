import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SplashGate } from "@/components/brand/splash-gate";
import { anton, epilogue } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ДВЖ — твой ритм",
  description:
    "Молодёжная соцсеть локальных активностей, челленджей и объявлений. Врывайся в движ своего района.",
  themeColor: "#08080D",
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
      className={`dark ${anton.variable} ${epilogue.variable} h-full bg-background`}
      style={{ backgroundColor: "#08080D", color: "#F0EEE8" }}
    >
      <body className="min-h-full bg-background text-foreground antialiased" style={{ backgroundColor: "#08080D", color: "#F0EEE8" }}>
        <TooltipProvider>
          <SplashGate>
            {children}
          </SplashGate>
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
