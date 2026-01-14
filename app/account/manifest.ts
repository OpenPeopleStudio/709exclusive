import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '709',
    short_name: '709',
    description: '709 Exclusive customer account',
    start_url: '/account/messages',
    scope: '/account/',
    display: 'standalone',
    background_color: '#0E0E0E',
    theme_color: '#0E0E0E',
    icons: [
      { src: '/account/app-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/account/app-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/account/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

