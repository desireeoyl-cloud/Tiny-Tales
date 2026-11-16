import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tiny Tales',
    short_name: 'Tiny Tales',
    description: 'Calm bedtime stories made from a real moment in your child’s day.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7efdd',
    theme_color: '#241b3b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
