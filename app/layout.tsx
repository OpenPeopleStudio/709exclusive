import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import BottomNav from "@/components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "709exclusive | Premium Sneakers & Streetwear",
  description: "St. John's premier destination for authentic sneakers and streetwear. Shop the latest drops and exclusive releases.",
  icons: {
    icon: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '709exclusive',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <CartProvider>
          <div className="min-h-screen pb-16 md:pb-0">
            {children}
          </div>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
