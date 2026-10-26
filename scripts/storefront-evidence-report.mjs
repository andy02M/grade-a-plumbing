import {writeFile} from 'node:fs/promises';
import {readSeoConfiguration} from './location-readiness.mjs';
const {locations}=readSeoConfiguration('lib/locations.ts');
const {locationHasService}=readSeoConfiguration('lib/seo-services.ts');
const rows=locations.map(location=>({
  location:location.location,homepage:location.website+'/',
  recordedAddress:location.address??null,
  suppliedGoogleProfile:location.googleBusinessProfile??null,
  serviceIndexingEnabled:locationHasService(location),
  evidenceStatus:'Repository and owner-supplied data only; not independently verified',
  outstanding:[...(!location.address?['Genuine public storefront address']:!/[0-9]/.test(location.address.streetAddress)?['Complete premises number']:[]),'Occupancy and signage evidence','Staffed customer-facing hours or correct service-area-business model','Current GBP status and matching website destination'],
}));
await writeFile('docs/seo-20261027-storefront-readiness.json',JSON.stringify({scope:'Evidence reconciliation, not a live Google verification result. No new addresses or profile statuses inferred.',summary:{locations:rows.length,missingRecordedAddress:rows.filter(row=>!row.recordedAddress).length,serviceIndexingEnabled:rows.filter(row=>row.serviceIndexingEnabled).length},locations:rows},null,2)+'\n');
console.log(JSON.stringify({locations:rows.length,missingRecordedAddress:rows.filter(row=>!row.recordedAddress).length}));
