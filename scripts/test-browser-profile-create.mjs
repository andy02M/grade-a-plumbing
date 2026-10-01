import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = `<!doctype html><html><head><meta charset="utf-8"><title>GMB fixture</title></head>
<body><main id="app"></main><script>
 const app=document.querySelector('#app'); let page='locations'; let type='SERVICE_AREA'; let activeHourButton=null;
const nextButton=target=>'<button data-go="'+target+'">Next</button>';
function show(name){page=name;render()}
function render(){
 if(page==='locations') app.innerHTML='<h1>Businesses</h1><button data-action="menu">Add business</button><div id="menu" hidden role="menu"><button role="menuitem" data-go="identity">Add single business</button></div>';
 if(page==='identity') app.innerHTML='<h1>Start building your Business Profile</h1><label>Business name<input aria-label="Business name" placeholder="Business name"></label><label>Business category<input id="category" aria-label="Business category" placeholder="Business category"></label><div id="categories" role="listbox" hidden><button role="option" data-action="category">Plumber</button></div>'+nextButton('location');
 if(page==='location') app.innerHTML='<h1>Do you want to add a location customers can visit?</h1><label><input type="radio" name="location" aria-label="Yes" data-type="STOREFRONT">Yes</label><label><input type="radio" name="location" aria-label="No" data-type="SERVICE_AREA">No</label><button data-action="location-next">Next</button>';
 if(page==='address') app.innerHTML='<h1>Where are you located?</h1><label>Street address<input aria-label="Street address"></label><label>Suburb<input aria-label="Suburb"></label><label>Postcode<input aria-label="Postcode"></label>'+nextButton('contact');
 if(page==='servicearea') app.innerHTML='<h1>Where do you serve your customers?</h1><label>Search and select areas<input id="area" aria-label="Search and select areas"></label><div id="areas" role="listbox" hidden><button role="option" data-action="area">CBD<br>Melbourne VIC, Australia</button></div>'+nextButton('contact');
 if(page==='contact') app.innerHTML='<h1>What contact details do you want to show to customers?</h1><label>Phone number<input aria-label="Phone number"></label><label>Website<input aria-label="Website"></label><label>Chat<select aria-label="Chat"><option selected>Text message</option><option>None</option></select></label><label id="chat-phone">Contact phone number<input aria-label="Contact phone number"></label><button data-action="contact-next">Next</button>';
 if(page==='verify') app.innerHTML='<h1>Please enter your mailing address to verify</h1><label>Street address<input aria-label="Street address"></label><label>Suburb<input aria-label="Suburb"></label><label>Postcode<input aria-label="Postcode"></label><button data-go="services">Verify later</button>';
 if(page==='services') app.innerHTML='<h1>Add your services</h1><button data-action="show-services">Show more</button><div id="more-services" hidden><button aria-pressed="false" data-action="service">Drain cleaning</button><button aria-pressed="false" data-action="service">Garbage disposal installation</button><button aria-pressed="false" data-action="service">Garbage disposal repair</button></div><p>Don’t see a service you offer? Create your own.</p><div id="custom-services"></div><button data-action="custom-service">Add custom service</button>'+nextButton('hours');
 if(page==='hours') app.innerHTML='<h1>Add business hours</h1>'+['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=>'<div class="hour-row"><span>'+d+'</span><div class="unlabeled-toggle" style="display:inline-block;width:40px;height:20px"></div><span class="closed">Closed</span><input data-action="hour-menu" placeholder="Opens at" hidden><input data-action="hour-menu" placeholder="Closes at" hidden></div>').join('')+'<div id="hour-options" role="listbox" hidden><button role="option" data-action="24-hours">Open 24 hours</button></div>'+nextButton('description');
 if(page==='description') app.innerHTML='<h1>Add business description</h1><label>Description<textarea aria-label="Description"></textarea></label>'+nextButton('shop');
 if(page==='shop') app.innerHTML='<h1>Add a storefront photo</h1><input type="file"><button data-go="work">Next</button>';
 if(page==='work') app.innerHTML='<h1>Add photos of your work</h1><input type="file" multiple><button data-go="ads">Next</button>';
 if(page==='ads') app.innerHTML='<h1>Claim your A$600 advertising credit</h1><button data-go="domain">Skip</button>';
 if(page==='domain') app.innerHTML='<h1>Get a custom domain name</h1><button data-go="edits">Skip</button>';
 if(page==='edits') app.innerHTML='<h1>Your edits will be visible once you are verified</h1><button data-go="complete">Continue</button>';
 if(page==='complete') app.innerHTML='<h1>Simulation complete</h1><p>No Google profile was created.</p>';
}
app.addEventListener('input',event=>{if(event.target.id==='category')document.querySelector('#categories').hidden=false;if(event.target.id==='area')document.querySelector('#areas').hidden=false});
app.addEventListener('change',event=>{if(event.target.dataset.type)type=event.target.dataset.type;if(event.target.getAttribute('aria-label')==='Chat'&&event.target.value==='None')document.querySelector('#chat-phone').remove()});
app.addEventListener('click',event=>{const toggle=event.target.closest('.unlabeled-toggle');if(toggle){const row=toggle.closest('.hour-row');row.querySelector('.closed').remove();row.querySelectorAll('[data-action="hour-menu"]').forEach(b=>b.hidden=false);return}const hourInput=event.target.closest('[data-action="hour-menu"]');if(hourInput){activeHourButton=hourInput;document.querySelector('#hour-options').hidden=false;return}const button=event.target.closest('button');if(!button)return;if(button.dataset.go)return show(button.dataset.go);if(button.dataset.action==='menu')return document.querySelector('#menu').hidden=false;if(button.dataset.action==='location-next')return show(type==='SERVICE_AREA'?'servicearea':'address');if(button.dataset.action==='contact-next')return show(type==='SERVICE_AREA'?'verify':'services');if(button.dataset.action==='show-services'){document.querySelector('#more-services').hidden=false;return button.remove()}if(button.dataset.action==='custom-service'){document.querySelector('#custom-services').insertAdjacentHTML('beforeend','<input maxlength="120">');return}if(button.dataset.action==='24-hours'){if(activeHourButton){const row=activeHourButton.closest('.hour-row');row.querySelectorAll('[data-action="hour-menu"]').forEach(b=>b.hidden=true);row.insertAdjacentHTML('beforeend','<span>Open 24 hours</span>')}return document.querySelector('#hour-options').hidden=true}if(button.dataset.action==='category'){document.querySelector('#category').value='Plumber';return document.querySelector('#categories').hidden=true}if(button.dataset.action==='area'){document.querySelector('#area').value='CBD, Melbourne VIC, Australia';return document.querySelector('#areas').hidden=true}if(button.dataset.action==='service')button.setAttribute('aria-pressed',button.getAttribute('aria-pressed')!=='true')});
render();
</script></body></html>`;

const server = createServer((_req, res) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); });
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "gmb-profile-fixture-"));

async function runFlow(businessType) {
  const settings = {
    title: `Fixture ${businessType}`,
    categoryLabel: "Plumber",
    categoryName: "Plumber",
    businessType,
    addressLine: "1 Test Street",
    city: "Melbourne",
    postalCode: "3000",
    phone: "03 9000 0000",
    websiteUri: "https://example.com",
    serviceAreas: [{ placeName: "Missing Suburb" }, { placeName: "Melbourne CBD" }],
    serviceAreaSuggestionLocation: "VIC, Australia",
    verificationAddress: { addressLine: "1 Private Street", city: "Melbourne", postalCode: "3000" },
    services: ["Drain cleaning", "Waste disposal installation", "Waste disposal repair"],
    customServices: ["Emergency Plumbing"],
    allDay: true,
    description: "Fixture description for safe automated testing.",
    shopFrontPhoto: path.join(root, "oauth-test-users-after.png"),
    workPhotos: [path.join(root, "oauth-test-users-after-save.png")],
  };
  const payloadPath = path.join(temp, `${businessType}.json`);
  await fs.writeFile(payloadPath, JSON.stringify({
    email: "fixture@example.com", dryRun: true, fixtureRunAllPages: true,
    fixtureBaseUrl: `http://127.0.0.1:${port}`, draftId: `fixture-${businessType}`, settings,
  }));
  const result = await new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(root, "scripts", "browser-profile-create.mjs"), "--payload", payloadPath], { cwd: root });
    let output = ""; child.stdout.on("data", d => output += d); child.stderr.on("data", d => output += d);
    child.on("error", reject); child.on("close", code => resolve({ code, output }));
  });
  assert.equal(result.code, 0, result.output);
  for (const proof of ["business-name-filled", "business-category-selected", "business-location-type-selected", "phone-number-filled", "chat-optional-ignored", "services-show-more-1-expanded", "service-Drain-cleaning-selected", "service-Waste-disposal-installation-selected", "service-Waste-disposal-repair-selected", "custom-service-Emergency-Plumbing-saved", "opening-hours-Monday-24-hours-verified", "opening-hours-Sunday-24-hours-verified", "opening-hours-configured", "business-description-filled", "uploaded-1-files-verified", "advertising-credit-skip-verified", "custom-domain-skip-verified", "profile-onboarding-continue-verified"])
    assert.match(result.output, new RegExp(proof), `Missing proof ${proof}\n${result.output}`);
  if (businessType === "SERVICE_AREA") {
    assert.match(result.output, /service-area-Missing-Suburb-unavailable-skipped/);
    assert.match(result.output, /Skipped unavailable service area: Missing Suburb/);
    assert.match(result.output, /service-area-Melbourne-CBD-selected/);
    assert.match(result.output, /verify-later-verified/);
  } else {
    assert.match(result.output, /street-address-filled/);
    assert.doesNotMatch(result.output, /verify-later-verified/);
  }
  console.log(`PASS ${businessType} full simulated GMB flow`);
}

try {
  await runFlow("SERVICE_AREA");
  await runFlow("STOREFRONT");
  console.log("PASS every simulated page used the production runner; localhost safety prevented any Google profile creation.");
} finally {
  server.close();
  await fs.rm(temp, { recursive: true, force: true });
}
