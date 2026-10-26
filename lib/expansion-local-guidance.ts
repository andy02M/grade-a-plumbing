import rows from '@/data/expansion-local-guidance.json';
import type {LocalGuidance} from './local-guidance';
import ownerUpdate from '@/data/owner-location-update-20261025.json';
export const expansionLocalGuidance: Record<string, LocalGuidance> = {};
for(const [slug,heading,introduction,fact,preparation,url] of rows) {
  const name=ownerUpdate.locationsInSuppliedOrder.find(name=>name.toLowerCase().replace(/[^a-z0-9]/g,'')===slug)??slug;
  expansionLocalGuidance[slug]={heading,introduction,metaDescription:introduction,checkedDate:'2026-10-27',contentUpdatedDate:'2026-10-27',paragraphs:[fact,preparation],faqs:[{question:`What should I prepare for an enquiry about ${name}?`,answer:preparation},{question:`Does this guidance confirm a diagnosis for a property in ${name}?`,answer:'No. Published authority guidance helps identify the right records and questions, but does not establish a fault, confirm ownership of a particular pipe or approve work.'}],relatedServices:['blocked-drains','sewer-repairs'],sources:[{title:new URL(url).hostname+' — property drainage guidance',url}]};
}
