import { services } from './data'

// Link directly to existing public endpoints instead of the visual-export aliases.
export function publicPageHref(href: string): string {
  const paths: Record<string, string> = {'/emergency-plumbing/':'/emergency-plumber/', '/hot-water-systems/':'/hot-water/', '/burst-pipe-repairs/':'/burst-pipe-repair/', '/contact-us/':'/contact/', '/about-us/':'/about/'}
  const match = href.match(/^(\/[^?#]*)(.*)$/)
  return match ? (paths[match[1]] ?? match[1]) + match[2] : href
}

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

