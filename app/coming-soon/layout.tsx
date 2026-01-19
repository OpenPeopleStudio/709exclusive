import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { getTenantFromRequest } from "@/lib/tenant"
import { getThemeStyleVars } from "@/lib/theme"
import { TenantProvider } from "@/context/TenantContext"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest()
  const theme = tenant?.settings?.theme
  const brandName = theme?.brand_name || tenant?.name || '709 Exclusive'

  return {
    title: `Coming Soon | ${brandName}`,
    description: `Something exclusive is coming. Be the first to know when ${brandName} launches.`,
    icons: {
      icon: theme?.logo_url || '/favicon.ico',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: brandName,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      title: `Coming Soon | ${brandName}`,
      description: `Something exclusive is coming. Be the first to know when ${brandName} launches.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Coming Soon | ${brandName}`,
      description: `Something exclusive is coming. Be the first to know when ${brandName} launches.`,
    },
  }
}

export default async function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantFromRequest()
  const themeStyle = getThemeStyleVars(tenant?.settings?.theme?.colors)

  return (
    <html lang="en" className="dark" data-tenant={tenant?.slug} style={themeStyle}>
      <body className={`${inter.variable} font-sans antialiased`} data-tenant-id={tenant?.id}>
        <TenantProvider tenant={tenant}>
          {children}
        </TenantProvider>
      </body>
    </html>
  )
}
