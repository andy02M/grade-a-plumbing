import { services } from './data'

const aliasRoutes: Record<string, string> = {
  '/emergency-plumber/': '/emergency-plumbing/',
  '/about-us/': '/about/',
  '/contact-us/': '/contact/',
  '/hot-water/': '/hot-water-systems/',
  '/burst-pipe-repair/': '/burst-pipe-repairs/',
}
const staticRoutes = ['/services/', '/our-work/', '/about/', '/service-areas/', '/contact/', '/reviews/']
const pageRoutes = [...staticRoutes, ...services.map(service => service.route)]

export function normalizePageRoute(input: string): string {
  const raw = input.replace(/\/+$/, '')
  const route = raw ? `${raw}/` : '/'
  return aliasRoutes[route] ?? route
}

export function isMarketingRoute(path: string): boolean {
  return pageRoutes.includes(normalizePageRoute(path))
}

