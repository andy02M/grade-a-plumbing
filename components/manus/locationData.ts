export type LocationRecord = {
  id: string
  name: string
  city: 'Melbourne' | 'Sydney'
  state: 'VIC' | 'NSW'
  postcode: string
  region: string
  lga: string | null
  lgaCode: string | null
  serviceAvailability: Record<string, 'available' | 'not-offered' | 'check-required'> | null
  activeService: boolean
  coverageStatus: 'confirmed-existing-directory' | 'owner-confirmed' | 'unconfirmed'
  greaterMelbourne: boolean
  source: string
  sourceId: number | null
  businessName: string
  website: string | null
  phone: string | null
  bookingUrl: string | null
}

export type LocationCatalogue = { metadata: Record<string, unknown>; locations: LocationRecord[] }
let cataloguePromise: Promise<LocationCatalogue> | null = null

export function loadLocationCatalogue(): Promise<LocationCatalogue> {
  if (!cataloguePromise) {
    cataloguePromise = import('./location-catalog.json').then(module => module.default as unknown as LocationCatalogue)
  }
  return cataloguePromise
}

export async function loadLocationById(id?: string | null): Promise<LocationRecord | undefined> {
  if (!id) return undefined
  const catalogue = await loadLocationCatalogue()
  return catalogue.locations.find(location => location.id === id)
}

export function normalizeLocationText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-AU').replace(/[^a-z0-9]/g, '')
}

export function locationMatchesQuery(query: string, location: LocationRecord): boolean {
  const terms = query.trim().split(/\s+/).map(normalizeLocationText).filter(term => term && !['postcode', 'suburb', 'locality'].includes(term))
  if (!terms.length) return true
  const index = normalizeLocationText(`${location.name} ${location.city} ${location.state} ${location.postcode} ${location.region} ${location.lga ?? ''}`)
  return terms.every(term => index.includes(term))
}

export function searchLocations(query: string, locations: LocationRecord[], limit = 8): LocationRecord[] {
  const terms = query.trim().split(/\s+/).map(normalizeLocationText).filter(term => term && !['postcode', 'suburb', 'locality'].includes(term))
  if (!terms.length || normalizeLocationText(query).length < 2) return []
  const needle = normalizeLocationText(query)
  const matches = locations.filter(location => locationMatchesQuery(query, location))
  return matches.sort((a, b) => {
    const aName = normalizeLocationText(a.name)
    const bName = normalizeLocationText(b.name)
    const aRank = aName === needle ? 0 : aName.startsWith(needle) ? 1 : normalizeLocationText(a.postcode).startsWith(needle) ? 2 : 3
    const bRank = bName === needle ? 0 : bName.startsWith(needle) ? 1 : normalizeLocationText(b.postcode).startsWith(needle) ? 2 : 3
    return aRank - bRank || a.name.localeCompare(b.name, 'en-AU') || a.postcode.localeCompare(b.postcode)
  }).slice(0, limit)
}

export function locationEnquiryHref(location: LocationRecord): string {
  return `/contact/?location=${encodeURIComponent(location.id)}`
}

export function locationLabel(location: LocationRecord): string {
  return `${location.name}, ${location.state} ${location.postcode}`
}

// Owner-specified cards are small and immediate; the 600+ row official catalogue is lazy-loaded.
export const SYDNEY_LOCATIONS: LocationRecord[] = [
  { id: 'sydney-penrith-nsw-2750', name: 'Penrith', city: 'Sydney', state: 'NSW', postcode: '2750', region: 'Sydney — confirmed locations', lga: 'Penrith City Council', lgaCode: null, serviceAvailability: null, activeService: true, coverageStatus: 'owner-confirmed', greaterMelbourne: false, source: 'Owner-provided location', sourceId: null, businessName: 'Grade A Plumber Penrith', website: 'https://penrith.gradeaplumbing.store', phone: null, bookingUrl: null },
  { id: 'sydney-blacktown-nsw-2148', name: 'Blacktown', city: 'Sydney', state: 'NSW', postcode: '2148', region: 'Sydney — confirmed locations', lga: 'Blacktown City Council', lgaCode: null, serviceAvailability: null, activeService: true, coverageStatus: 'owner-confirmed', greaterMelbourne: false, source: 'Owner-provided location', sourceId: null, businessName: 'Grade A Plumber Blacktown', website: 'https://blacktown.gradeaplumbing.store', phone: null, bookingUrl: null },
  { id: 'sydney-north-sydney-nsw-2060', name: 'North Sydney', city: 'Sydney', state: 'NSW', postcode: '2060', region: 'Sydney — confirmed locations', lga: 'North Sydney Council', lgaCode: null, serviceAvailability: null, activeService: true, coverageStatus: 'owner-confirmed', greaterMelbourne: false, source: 'Owner-provided location', sourceId: null, businessName: 'Grade A Plumber North Sydney', website: 'https://northsydney.gradeaplumbing.store', phone: null, bookingUrl: null },
]

