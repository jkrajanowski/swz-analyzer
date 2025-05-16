import type { NextConfig } from 'next'
import type { WebpackConfigContext } from 'next/dist/server/config-shared'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'], // ✅ New official key in Next.js 15+
  experimental: {
    serverActions: {},
  },
  webpack: (config: any, { isServer }: WebpackConfigContext) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
        },
      }
    }
    return config
  },
}

export default nextConfig
