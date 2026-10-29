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
 assert.match(read('components/manus/HomeAreas.tsx'),/nearbyLocations.map/);
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
 assert.match(read('components/manus/App.tsx'),/fill loading="eager" sizes="100vw"/);
 assert.match(read('components/manus/App.tsx'),/fetchPriority="high"/);
 assert.match(read('components/manus/components.tsx'),/sizes="\(max-width: 768px\) 146px, 184px"/);
});
test('Sydney enquiries remain while known 404 website links are suppressed',()=>{
 const source=read('components/manus/locationData.ts');
 assert.match(source,/catalogue.locations.map\(withWorkingWebsite\)/);
 assert.match(source,/suppliedSydneyLocations.map\(withWorkingWebsite\)/);
 for(const city of ['Penrith','Blacktown','North Sydney'])assert.ok(source.includes(city));
 assert.match(read('components/manus/HomeAreas.tsx'),/Request plumbing help/);
});
test("owner update configures every supplied location once without deleting omitted hosts", async () => {
  const update = readSeoConfiguration('data/owner-location-update-20261025.json');
  const {locations, isUnconfiguredLocationHost} = readSeoConfiguration('lib/locations.ts');
  assert.equal(locations.length, 96);
  assert.equal(new Set(locations.map(location => location.slug)).size, 96);
  for (const name of new Set(update.locationsInSuppliedOrder)) {
    const location = locations.find(item => item.location === name);
    assert.ok(location, name);
    assert.equal(isUnconfiguredLocationHost(location.hostname), false);
    assert.equal(location.website, `https://${location.slug}.gradeaplumbing.store`);
  }
  for (const name of ['Geelong', 'Deanside', 'Thomastown']) assert.ok(locations.some(item => item.location === name));
  const {locationHasService} = readSeoConfiguration('lib/seo-services.ts');
  const {loadLocationCatalogue} = readSeoConfiguration('components/manus/locationData.ts');
  const catalogue = await loadLocationCatalogue();
  for (const slug of ['mordialloc','huntingdale','truganina','doreen','noblepark','docklands','macleod','mooneeponds','pascoevale','tullamarine','aspendale','kingspark','keilor','mernda']) {
    const location = locations.find(item => item.slug === slug);
    assert.equal(locationHasService(location), false, `${slug}: keep evidence-based service indexing safeguards`);
    assert.equal(location.address, undefined, `${slug}: no invented storefront`);
    const directoryEntry = catalogue.locations.find(item => item.name === location.location && item.state === 'VIC');
    assert.equal(directoryEntry.activeService, true);
    assert.equal(directoryEntry.coverageStatus, 'owner-confirmed');
    assert.equal(directoryEntry.website, location.website);
    assert.match(directoryEntry.postcode, /^\d{4}$/);
  }
});
test("article media adds topic variety without overriding editorial images", () => {
  const {withArticleMedia} = readSeoConfiguration('lib/article-media.ts');
  const {publishedArticles} = readSeoConfiguration('lib/articles.ts');
  const generated = publishedArticles.filter(article => article.heroImage?.includes('/generated/'));
  assert.equal(new Set(generated.map(article => article.heroImage)).size, 4);
  for (const article of generated) {
    assert.ok(article.heroImageAlt.startsWith('Illustrative'));
    assert.ok(readFileSync(new URL('../public'+article.heroImage, import.meta.url)).length > 0);
  }
  const custom = {title:'Hot water',slug:'hot-water',heroImage:'/custom.webp'};
  assert.equal(withArticleMedia(custom), custom);
  assert.match(withArticleMedia({title:'Washing machine laundry',slug:'laundry'}).heroImage, /laundry-connections/);
});
test("supplied reviews preserve all entries without adding locations or invented text", () => {
  const {customerReviews} = readSeoConfiguration('lib/customer-reviews.ts');
  assert.equal(customerReviews.length, 191);
  assert.equal(customerReviews.filter(review=>review.text).length, 172);
  assert.equal(customerReviews.filter(review=>!review.text).length, 19);
  assert.equal(new Set(customerReviews.map(review=>review.name+'\n'+(review.text??''))).size, 191);
  for(const review of customerReviews) {
    assert.equal(review.rating, 5);
    assert.ok(review.name.trim());
    assert.ok(Object.keys(review).every(key=>['name','text','rating','date'].includes(key)));
  }
  assert.match(customerReviews.find(review=>review.name==='Abe Van').text, /\n/);
  const page = readFileSync(new URL('../components/manus/MarketingPages.tsx',import.meta.url),'utf8').split('function ReviewsPage(')[1].split('function upsertMeta')[0];
  assert.doesNotMatch(page, /sourceUrl|\.filter\(\(r\) => r.text\)/);
  assert.doesNotMatch(readFileSync(new URL('../components/CustomerReviews.tsx',import.meta.url),'utf8'), /location-reviews|sourceUrl/);
  for(const [label,count] of [['2 months ago',50],['1 month ago',50],['3 weeks ago',50],['1 week ago',41]]) assert.equal(customerReviews.filter(review=>review.date===label).length,count);
  assert.match(page, /reviewDateReference/);
});
test("reviews library keeps the complete collection behind search and incremental browsing", () => {
  const page = readFileSync(new URL('../components/manus/MarketingPages.tsx',import.meta.url),'utf8').split('function ReviewsPage(')[1].split('function upsertMeta')[0];
  assert.match(page, /useState\(12\)/);
  assert.match(page, /matchingReviews.slice\(reviewStart,reviewStart\+reviewLimit\)/);
  assert.match(page, /limit => limit\+12/);
  assert.match(page, /setReviewLimit\(12\)/);
  assert.match(page, /aria-expanded/);
  assert.match(page, /aria-controls/);
  assert.match(page, /No reviews match your search/);
});
test('shared corporate canonicals consolidate without changing local service targets',()=>{
 const {pageCanonical,editorialOrigin}=readSeoConfiguration('lib/canonical-policy.ts');
 for(const location of locations){
  for(const path of ['/about/','/reviews/','/our-work/','/service-areas/','/payment/'])assert.equal(pageCanonical(location.website,path),editorialOrigin+path);
  assert.equal(pageCanonical(location.website,'/blocked-drains/'),location.website+'/blocked-drains/');
 }
 const {publicPageHref}=readSeoConfiguration('components/manus/routes.ts');
 assert.equal(publicPageHref('/about-us/'),editorialOrigin+'/about/');
 assert.equal(publicPageHref('/service-areas/?state=NSW'),editorialOrigin+'/service-areas/?state=NSW');
 assert.equal(publicPageHref('/payment/'),editorialOrigin+'/payment/');
 assert.match(read('app/payment/page.tsx'),/pageCanonical\(location\.website, "\/payment\/"\)/);
 assert.match(read('app/sitemap.ts'),/isEditorialHost \? \[\{ url: `\$\{location\.website\}\/payment\/`/);
});
test('all review pages are discoverable with distinct canonical paths',()=>{
 const {reviewPageNumber,reviewPagePath,reviewsPerPage}=readSeoConfiguration('lib/review-pagination.ts');
 const {customerReviews}=readSeoConfiguration('lib/customer-reviews.ts');
 assert.equal(reviewsPerPage,12);
 assert.equal(reviewPageNumber('0',191),1);assert.equal(reviewPageNumber('999',191),16);assert.equal(reviewPageNumber('bad',191),1);
 const covered=[];
 for(let page=1;page<=16;page++){assert.equal(reviewPagePath(page),page===1?'/reviews/':`/reviews/?page=${page}`);covered.push(...customerReviews.slice((page-1)*12,page*12));}
 assert.equal(covered.length,191);
 assert.equal(new Set(covered.map(review=>review.name+'\n'+(review.text??''))).size,191);
});
test('quote context supports every service without replacing the existing endpoint',()=>{
 const {quoteServiceDefault,quoteServiceOptions}=readSeoConfiguration('lib/quote-context.ts');
 for(const slug of serviceSlugs)assert.ok(quoteServiceOptions.includes(quoteServiceDefault(slug)),slug);
 const component=read('components/ContactForm.tsx');
 assert.match(component,/fetch\("\/api\/quote"/);assert.match(component,/suburbEdited.current/);assert.match(component,/submissionLock.current/);
 assert.match(read('components/manus/components.tsx'),/defaultSuburb=\{suburb\}/);
 assert.match(read('components/manus/components.tsx'),/location.state.*location.postcode/);
});
