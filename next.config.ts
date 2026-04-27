import type { NextConfig } from 'next'

// URL del backend Express. En producción, cambiar a la URL real del servidor.
// En dev: el backend corre en localhost:3001 y Next.js en localhost:3000.
// En producción: tipicamente el mismo host con nginx haciendo split por /api/.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Todas las llamadas a /api/* desde el frontend se redirigen al backend.
        // El browser nunca se comunica directamente con el backend —
        // Next.js actúa como proxy, preservando cookies y cabeceras de auth.
        source:      '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
