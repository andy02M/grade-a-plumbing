import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {readSeoConfiguration} from './location-readiness.mjs';
const {locations}=readSeoConfiguration('lib/locations.ts');
const {serviceIdentity,pageMetadata,pageBreadcrumbs}=readSeoConfiguration('lib/page-seo.ts');
const read=path=>readFileSync(path,'utf8');
const serviceSlugs=['blocked-drains','sewer-repairs','pipe-relining','hot-water','emergency-plumber','burst-pipe-repair','gas-plumbing','commercial-plumbing','toilet-repairs','kitchen-plumbing','bathroom-plumbing','leak-detection'];
test('public links preserve anchors, queries and external destinations while bypassing aliases',()=>{
 const {publicPageHref}=readSeoConfiguration('components/manus/routes.ts');
 assert.equal(publicPageHref('/hot-water-systems/?a=1#questions'),'/hot-water/?a=1#questions');
 assert.equal(publicPageHref('tel:0258375457'),'tel:0258375457');
 assert.equal(publicPageHref('#service-quote'),'#service-quote');
 assert.equal(publicPageHref('https://example.com/hot-water-systems/'),'https://example.com/hot-water-systems/');
});
test('all configured locations and twelve service types have aligned unique local metadata',()=>{
 const titles=new Set();
 for(const location of locations)for(const slug of serviceSlugs){
  const identity=serviceIdentity(slug,location.location);
  assert.ok(identity.title.includes(location.location));assert.ok(identity.description.includes(location.location));
  assert.ok(!titles.has(identity.title),identity.title);titles.add(identity.title);
  const meta=pageMetadata(identity.title,identity.description,location.website+'/'+slug+'/');
  assert.equal(meta.alternates.canonical,location.website+'/'+slug+'/');
  assert.equal(meta.openGraph.url,meta.alternates.canonical);assert.equal(meta.twitter.title,identity.title);
 }
 assert.equal(titles.size,locations.length*12);
});
test('UI service aliases share canonical identity without changing public routes',()=>{
 assert.equal(serviceIdentity('emergency-plumbing','Coburg').slug,'emergency-plumber');
 assert.equal(serviceIdentity('hot-water-systems','Coburg').slug,'hot-water');
 assert.equal(serviceIdentity('burst-pipe-repairs','Coburg').slug,'burst-pipe-repair');
 assert.equal(serviceIdentity('not-a-service','Coburg'),undefined);
});
test('server passes host location into visible homepage and service heroes',()=>{
 assert.match(read('app/page.tsx'),/locationName=\{location.location\}/);
 assert.match(read('app/[service]/page.tsx'),/locationName=\{l.location\}/);
 assert.match(read('components/manus/MarketingPages.tsx'),/highlight=\{locationName === "Melbourne"/);
 assert.match(read('components/manus/App.tsx'),/\{locationName\} plumbing/);
 assert.match(read('components/manus/App.tsx'),/nearbyLocations.map/);
});
test('breadcrumbs stay on the requested host and social URLs normalise origin roots',()=>{
 const schema=pageBreadcrumbs('https://coburg.gradeaplumbing.store',[{name:'Home',path:'/'},{name:'Services',path:'/services/'}]);
 assert.equal(schema.itemListElement[1].item,'https://coburg.gradeaplumbing.store/services/');
 assert.equal(schema.itemListElement[0].position,1);
 assert.equal(pageMetadata('Title','Description','https://coburg.gradeaplumbing.store').alternates.canonical,'https://coburg.gradeaplumbing.store/');
});
test('article metadata uses the visible hero and publisher without fictional ratings',()=>{
 const page=read('app/blog/[slug]/page.tsx');
 assert.match(page,/articleHeroMedia\(a\)/);assert.match(page,/publisher:/);assert.match(page,/pageBreadcrumbs/);
 assert.doesNotMatch(page,/aggregateRating|priceRange/);
});
test('image performance keeps the artwork and bounds favicon transfer size',()=>{
 assert.ok(statSync('public/icon-64.png').size<10000);
 assert.match(read('app/layout.tsx'),/icon-64.png/);
 assert.match(read('components/manus/App.tsx'),/fill priority sizes="100vw"/);
 assert.match(read('components/manus/components.tsx'),/sizes="\(max-width: 768px\) 146px, 184px"/);
});
test('Sydney enquiries remain while known 404 website links are suppressed',()=>{
 const source=read('components/manus/locationData.ts');
 assert.match(source,/catalogue.locations.map\(withWorkingWebsite\)/);
 assert.match(source,/suppliedSydneyLocations.map\(withWorkingWebsite\)/);
 for(const city of ['Penrith','Blacktown','North Sydney'])assert.ok(source.includes(city));
 assert.match(read('components/manus/App.tsx'),/Request plumbing help/);
});
