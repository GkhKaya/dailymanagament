import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name: 'DailyM', short_name: 'DailyM', description: 'Kişisel yönetim asistanı', start_url: '/dashboard', display: 'standalone', background_color: '#0c0c14', theme_color: '#0c0c14', icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }] }; }
