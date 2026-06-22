import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { anton, epilogue } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ДВИЖ — город в движении",
  description:
    "Молодёжная соцсеть локальных активностей, челленджей и объявлений. Врывайся в движ своего района.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${anton.variable} ${epilogue.variable} h-full`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
