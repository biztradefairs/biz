/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sfcc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sfcc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'techexpo2025.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bfs2025.com', // Add this domain
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      // Allow all images during development (not recommended for production)
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              protocol: 'https',
              hostname: '**',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
}

export default nextConfig