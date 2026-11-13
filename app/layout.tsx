import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/src/store/StoreProvider";
import { PwaRegistrar } from "@/src/components/layout/PwaRegistrar";
import type { Viewport } from "next";
import { assetPath } from "@/src/lib/assetPath";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "McSiRun | Tactical Edition",
  description: "A tactical arcade game set in the streets of cs_italy.",
  manifest: assetPath("/manifest.json"),
  appleWebApp: { capable: true, title: "McSiRun" },
};

export const viewport: Viewport = { themeColor: "#0E0D15" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StoreProvider><PwaRegistrar>{children}</PwaRegistrar></StoreProvider>
      </body>
    </html>
  );
}
