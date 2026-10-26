export const quoteServiceOptions = ['Emergency plumbing','Blocked drain','Hot water repair','Leaking tap or toilet','Burst pipe','Gas plumbing','Commercial plumbing','Sewer repairs','Pipe relining','Toilet repairs','Kitchen plumbing','Bathroom plumbing','Leak detection','General maintenance','Other'];
export function quoteServiceDefault(value: string) {
  const text=value.toLowerCase().replace(/[^a-z0-9]/g,'');
  const exact=quoteServiceOptions.find(option=>option.toLowerCase().replace(/[^a-z0-9]/g,'')===text);
  if(exact)return exact;
  if(text.includes('sewer'))return 'Sewer repairs';
  if(text.includes('relining'))return 'Pipe relining';
  if(text.includes('toilet'))return 'Toilet repairs';
  if(text.includes('kitchen'))return 'Kitchen plumbing';
  if(text.includes('bathroom'))return 'Bathroom plumbing';
  if(text.includes('leakdetection'))return 'Leak detection';
  if(text.includes('emergency')) return 'Emergency plumbing';
  if(text.includes('drain')||text.includes('sewer')||text.includes('relining')) return 'Blocked drain';
  if(text.includes('hotwater')) return 'Hot water repair';
  if(text.includes('toilet')||text.includes('tap')) return 'Leaking tap or toilet';
  if(text.includes('burst')) return 'Burst pipe';
  if(text.includes('gas')) return 'Gas plumbing';
  if(text.includes('commercial')) return 'Commercial plumbing';
  return quoteServiceOptions.find(option=>option.toLowerCase().replace(/[^a-z0-9]/g,'')===text) ?? '';
}
