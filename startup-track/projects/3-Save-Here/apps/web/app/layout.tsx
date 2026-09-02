import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Save & Recall",
  description: "A private place for everything worth remembering.",
  applicationName: "Save & Recall",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Recall",
  },
};

export const viewport: Viewport = {
  themeColor: "#121713",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
