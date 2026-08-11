import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DailyM',
    short_name: 'DailyM',
    description: 'Kişisel yönetim asistanı',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0c0c14',
    theme_color: '#0c0c14',
    icons: [
      {
        src: '/assets/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/logo.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple touch icon' as any,
      },
      {
        src: '/assets/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
