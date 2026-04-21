import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRM Local",
  description: "CRM simple y local para tu negocio",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = getSettings();
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
      style={{ "--brand-hue": settings.brand_hue } as React.CSSProperties}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:
                  "bg-card text-card-foreground border border-border shadow-lg",
                description: "text-muted-foreground",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
