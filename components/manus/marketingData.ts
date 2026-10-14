import { services } from './data'

export type PageCard = {
  title: string
  body: string
  image?: string
  route?: string
  tag?: string
}
export type PageFAQ = { question: string; answer: string }
export type ServiceDetail = {
  title: string
  eyebrow: string
  lead: string
  highlight: string
  description: string
  image: string
  imageAlt: string
  introTitle: string
  introBody: string
  cards: PageCard[]
  featureTitle: string
  featureBody: string
  featureImage: string
  featureAlt: string
  benefits: string[]
  process: string[]
  faqs: PageFAQ[]
  safetyNote?: string
  systemTypes?: PageCard[]
}

const image = (name: string) => `/assets/grade-a/${name}.webp`
const card = (title: string, body: string, photo: string, route?: string): PageCard => ({ title, body, image: image(photo), route })
const commonFAQs: PageFAQ[] = [
  { question: 'What information should I provide?', answer: 'Tell us your suburb, the affected fixture or pipe, what you have noticed and when it began. Photos can help if it is safe to take them.' },
  { question: 'When can someone attend?', answer: 'Availability depends on location, current bookings and the work required. Call to discuss the next available option; no arrival time is guaranteed by this preview.' },
  { question: 'Will I know the cost before work starts?', answer: 'The scope and price depend on the cause and access. Where the work can be properly assessed, the proposed work and pricing should be explained before it proceeds.' },
  { question: 'Can I request a quote online?', answer: 'Yes. The form can collect your details in this preview, but an enquiry-receiving service has not been connected. For a live enquiry, call (02) 5837 5457 or email support@gradeaplumbing.store.' },
]

export const serviceDetails: Record<string, ServiceDetail> = {
  'emergency-plumbing': {
    title: 'Emergency Plumbing', eyebrow: 'EMERGENCY PLUMBING · MELBOURNE', lead: '24/7 Emergency Plumber', highlight: 'Melbourne',
    description: 'Urgent leaks, burst pipes, blocked drains and plumbing faults need a calm next step. Call to discuss the issue and current availability.',
    image: image('hero-plumber-under-sink'), imageAlt: 'plumbing technician working beneath a sink',
    introTitle: 'Fast help when you need it most.', introBody: 'Describe the issue, where you are and any immediate risks. We will discuss the appropriate next step and current availability.',
    cards: [
      card('Burst & leaking pipes', 'Visible leaks, damaged pipework or water where it should not be.', 'burst-copper-pipe', '/burst-pipe-repairs/'),
      card('Blocked drains', 'Slow, overflowing or backed-up drains and fixtures.', 'blocked-drains-closeup', '/blocked-drains/'),
      card('Toilet overflows', 'Blocked, leaking or overflowing toilet concerns.', 'toilet-repairs', '/toilet-repairs/'),
      card('Hot-water failures', 'A leak, no hot water or a system that is not working as expected.', 'hot-water-cylinder', '/hot-water-systems/'),
      card('Water leak concerns', 'Suspected hidden or visible leaks that need assessment.', 'leak-detection', '/leak-detection/'),
      card('Sewer concerns', 'Recurring blockages, wastewater backup or damaged sewer lines.', 'sewer-pipe-lining', '/sewer-repairs/'),
    ],
    featureTitle: 'Clear next steps, without the guesswork.', featureBody: 'We ask what has happened, explain the available next step and discuss the work before proceeding. Availability and the right response depend on the job and location.',
    featureImage: image('emergency-plumber-working'), featureAlt: 'plumbing work in progress',
    benefits: ['A clear conversation about the issue', 'Practical guidance for the next step', 'Work scope discussed before proceeding', 'Residential and commercial enquiries'],
    process: ['Call and describe the issue', 'Discuss the next available response', 'Review the proposed scope and price', 'Complete and explain agreed work'],
    faqs: [
      { question: 'What should I do while waiting?', answer: 'If it is safe and you know how, isolate the water supply to the affected fixture or property. Keep clear of water near electrical equipment and do not enter an unsafe area. Call emergency services if someone is in immediate danger.' },
      ...commonFAQs.slice(1),
    ],
  },
  'blocked-drains': {
    title: 'Blocked Drains', eyebrow: 'BLOCKED DRAINS · MELBOURNE', lead: 'Blocked Drains', highlight: 'Melbourne',
    description: 'Slow drains, gurgling pipes, unpleasant smells or overflows may indicate a blockage. Share what you have noticed so the cause can be assessed.',
    image: image('blocked-drains-closeup'), imageAlt: 'close view of drain pipework',
    introTitle: 'Get flow back with a clearer diagnosis.', introBody: 'A blockage can come from different sources. The next step depends on the location, symptoms and condition of the drain.',
    cards: [
      card('Blocked drains', 'Assessment and clearing options for backed-up household drains.', 'blocked-drains-closeup'),
      card('Tree-root intrusion', 'Recurring blockages may need further investigation of the drain line.', 'sewer-pipe-lining'),
      card('Drain camera inspection', 'Inspection options to help understand a recurring or unclear problem.', 'drain-inspection'),
      card('High-pressure jetting', 'Discuss clearing methods appropriate to the pipe and blockage.', 'bathroom-inspection'),
      card('Sewer line blockages', 'Sewer concerns require the affected line and symptoms to be assessed.', 'sewer-pipe-lining', '/sewer-repairs/'),
      card('Ongoing prevention', 'Discuss practical maintenance options after the cause is understood.', 'emergency-plumber-working'),
    ],
    featureTitle: 'Clearer drains. Healthier homes.', featureBody: 'The right clearing method depends on what is causing the blockage. We explain the assessment and available options before work goes ahead.',
    featureImage: image('drain-inspection'), featureAlt: 'drain inspection in progress',
    benefits: ['Understand the likely cause', 'Choose a suitable assessment', 'Know the proposed scope', 'Reduce guesswork on recurring issues'],
    process: ['Describe the symptoms', 'Locate and assess the affected drain', 'Discuss clearing or investigation options', 'Review flow and explain next steps'],
    faqs: [
      { question: 'Why does the same drain keep blocking?', answer: 'Repeat blockages can have several causes, including material in the line, pipe condition or an obstruction further along. Inspection may be needed to identify what is happening.' },
      { question: 'Should I use chemical drain cleaner?', answer: 'Avoid mixing products or using chemicals if you are unsure what is already in the drain. Tell the plumber about any products used before work begins.' },
      ...commonFAQs.slice(0, 2), commonFAQs[3],
    ],
  },
  'hot-water-systems': {
    title: 'Hot Water Systems', eyebrow: 'HOT WATER SYSTEMS · MELBOURNE', lead: 'Hot Water Systems', highlight: 'Melbourne',
    description: 'Repairs, replacement enquiries and installation assessments for hot-water systems. Options depend on the unit, condition and property.',
    image: image('hot-water-service'), imageAlt: 'technician beside a hot-water system',
    introTitle: 'Reliable hot water, when you need it.', introBody: 'Tell us the system type, make or model if known, the symptoms and your suburb. We can discuss an appropriate next step.',
    cards: [
      card('Hot-water repairs', 'Assessment of a leak, inconsistent temperature or a system that is not operating.', 'hot-water-cylinder'),
      card('Replacement enquiries', 'Discuss whether repair or replacement should be assessed for the existing unit.', 'hot-water-service'),
      card('Installation enquiries', 'Installation options depend on the system, site and applicable requirements.', 'plumber-at-door'),
    ],
    featureTitle: 'Know the system before choosing a fix.', featureBody: 'The unit, age, fuel source, access and condition affect the suitable options. Service availability must be confirmed for the specific system.',
    featureImage: image('hot-water-cylinder'), featureAlt: 'hot-water cylinder',
    benefits: ['Share the system make and model', 'Describe any leak or temperature change', 'Discuss repair versus replacement', 'Confirm the scope before proceeding'],
    process: ['Describe the symptoms', 'Identify the unit and site', 'Review assessment options', 'Agree the work and price'],
    systemTypes: [
      { title: 'No hot water', body: 'Describe when the problem began and whether the whole property is affected.' },
      { title: 'Leaks or drips', body: 'If safe, note where water is visible and whether it is getting worse.' },
      { title: 'Temperature changes', body: 'Share any change in water temperature or consistency.' },
      { title: 'Fault indicators', body: 'If visible, note the make, model or error code without removing covers.' },
    ],
    faqs: [
      { question: 'What details help with a hot-water enquiry?', answer: 'If safe, note the brand, model, approximate age, fuel type, any error code, and whether there is a leak. Do not remove covers or attempt electrical or gas repairs.' },
      { question: 'Can you advise whether my unit should be repaired or replaced?', answer: 'That depends on the fault, condition, parts and system type. The options can be discussed after the unit is assessed.' },
      ...commonFAQs.slice(1, 2), commonFAQs[3],
    ],
  },
  'burst-pipe-repairs': {
    title: 'Burst Pipe Repairs', eyebrow: 'BURST PIPE REPAIRS · MELBOURNE', lead: 'Burst Pipe Repairs', highlight: 'Melbourne',
    description: 'A burst or leaking pipe can cause water damage. Call to discuss safe isolation and the next step for assessment.',
    image: image('burst-copper-pipe'), imageAlt: 'damaged copper pipe with water leak',
    introTitle: 'Stop water damage from spreading.', introBody: 'A sudden leak, wet patch or change in water pressure can have several causes. Describe where the water is and what is affected.',
    cards: [
      { title: 'Unexpected water', body: 'Water appearing on walls, ceilings, floors or outside.', tag: 'SIGN TO CHECK' },
      { title: 'Pressure changes', body: 'An unexplained drop or change can be one clue; it is not a diagnosis.', tag: 'SIGN TO CHECK' },
      { title: 'Damp or staining', body: 'New moisture, bubbling paint or discolouration may need assessment.', tag: 'SIGN TO CHECK' },
      { title: 'Unusual sounds', body: 'Running or hissing sounds when water is not in use may warrant investigation.', tag: 'SIGN TO CHECK' },
    ],
    featureTitle: 'If safe, isolate the water supply.', featureBody: 'If the leak is severe and it is safe to do so, use the appropriate shut-off valve. Stay clear of water near electrical equipment. If the area is unsafe, move away and call emergency services if anyone is in immediate danger.',
    featureImage: image('burst-copper-pipe'), featureAlt: 'burst copper pipe',
    benefits: ['Describe where the water is visible', 'Keep clear of electrical hazards', 'Share any recent pressure changes', 'Wait for an assessment before repair'],
    process: ['Call and explain the leak', 'Discuss safe isolation where appropriate', 'Assess pipework and access', 'Review repair scope and pricing'],
    faqs: [
      { question: 'Should I turn the water off?', answer: 'If the leak is severe and you can reach the appropriate valve safely, isolating the supply may limit water flow. Do not approach water near electrical equipment or enter an unsafe area.' },
      { question: 'Can I repair a pipe myself?', answer: 'Do not attempt a repair if you are unsure, the leak is near electricity, or the pipework is inaccessible. Contact a plumber to discuss an assessment.' },
      ...commonFAQs.slice(1, 2), commonFAQs[3],
    ],
  },
  'toilet-repairs': {
    title: 'Toilet Repairs', eyebrow: 'TOILET REPAIRS · MELBOURNE', lead: 'Toilet Repairs', highlight: 'Melbourne', description: services.find(s => s.slug === 'toilet-repairs')!.description,
    image: image('toilet-repairs'), imageAlt: 'toilet and bathroom plumbing', introTitle: 'Help with toilet faults and leaks.', introBody: 'Tell us whether the toilet is blocked, leaking, constantly running or not flushing as expected.',
    cards: [card('Blocked toilets', 'Assessment of slow, backed-up or overflowing toilets.', 'toilet-repairs'), card('Leaking cisterns', 'Water that continues to run or collects around the cistern.', 'bathroom-toilet-technician'), card('Leaks near the base', 'Moisture around the toilet may need prompt inspection.', 'bathroom-inspection')],
    featureTitle: 'Find the cause before the repair.', featureBody: 'The right repair depends on the fixture, connection and symptoms. We explain what needs attention and discuss the scope before proceeding.', featureImage: image('bathroom-toilet-technician'), featureAlt: 'bathroom plumbing technician',
    benefits: ['Describe the fixture and symptom', 'Share when the issue started', 'Keep clear of overflowing water', 'Discuss the repair before it begins'], process: ['Describe the fault', 'Assess the toilet and connections', 'Explain the proposed repair', 'Complete and check agreed work'], faqs: commonFAQs,
  },
  'gas-plumbing': {
    title: 'Gas Plumbing', eyebrow: 'GAS PLUMBING · MELBOURNE', lead: 'Gas Plumbing', highlight: 'Melbourne', description: services.find(s => s.slug === 'gas-plumbing')!.description,
    image: image('gas-plumbing'), imageAlt: 'gas pipework and valve', introTitle: 'Gas enquiries need a careful next step.', introBody: 'Tell us whether your enquiry concerns an appliance connection, gas pipework or a suspected leak. Do not attempt to inspect or repair a gas installation yourself.',
    cards: [card('Gas leak concerns', 'Move to safety and contact the gas emergency service if you suspect a leak.', 'gas-plumbing'), card('Appliance connections', 'Discuss the appliance and property requirements before booking.', 'hot-water-service'), card('Gas pipework', 'Assessment and work scope depend on the installation and applicable requirements.', 'hot-water-cylinder')],
    featureTitle: 'Safety first for gas concerns.', featureBody: 'If you suspect a gas leak, leave the area and contact your gas distributor or emergency services from a safe location. Do not operate appliances or attempt repairs. For other gas plumbing enquiries, call to discuss the appropriate next step.', featureImage: image('emergency-plumber-working'), featureAlt: 'plumbing service image',
    benefits: ['Do not attempt gas repairs', 'Move away if you suspect a leak', 'Contact the relevant emergency service', 'Confirm service scope before booking'], process: ['Describe the enquiry from a safe place', 'Confirm the type of installation', 'Discuss the appropriate next step', 'Agree any scope before work proceeds'], faqs: commonFAQs,
  },
  'sewer-repairs': {
    title: 'Sewer Repairs', eyebrow: 'SEWER REPAIRS · MELBOURNE', lead: 'Sewer Repairs', highlight: 'Melbourne', description: services.find(s => s.slug === 'sewer-repairs')!.description,
    image: image('sewer-pipe-lining'), imageAlt: 'sewer pipe lining and inspection', introTitle: 'Understand recurring sewer issues.', introBody: 'Repeated blockages, odours or wastewater concerns may need investigation to identify the affected line and possible cause.',
    cards: [card('Recurring blockages', 'Describe where the problem occurs and how often it returns.', 'blocked-drains-closeup'), card('Line inspection', 'Discuss inspection options if the cause is unclear.', 'drain-inspection'), card('Repair options', 'The suitable repair depends on the pipe condition and assessment.', 'sewer-pipe-lining')],
    featureTitle: 'Evidence before repair decisions.', featureBody: 'A recurring sewer problem can have different causes. A suitable assessment helps define which options are relevant.', featureImage: image('drain-inspection'), featureAlt: 'drain inspection',
    benefits: ['Record repeat symptoms', 'Identify which fixtures are affected', 'Discuss inspection options', 'Review repair scope before approval'], process: ['Describe the wastewater concern', 'Assess the affected line', 'Discuss findings and options', 'Agree scope and pricing'], faqs: commonFAQs,
  },
  'pipe-relining': {
    title: 'Pipe Relining', eyebrow: 'PIPE RELINING · MELBOURNE', lead: 'Pipe Relining', highlight: 'Melbourne', description: services.find(s => s.slug === 'pipe-relining')!.description,
    image: image('sewer-pipe-lining'), imageAlt: 'pipe relining equipment and pipework', introTitle: 'Is no-dig repair suitable?', introBody: 'Relining is not suitable for every drain. Pipe condition, access and inspection findings determine which options should be considered.',
    cards: [card('Pipe inspection', 'Understand the drain condition before discussing lining.', 'drain-inspection'), card('Lining suitability', 'Suitability depends on pipe condition and access.', 'sewer-pipe-lining'), card('Other repair options', 'Where relining is not suitable, other solutions may need assessment.', 'blocked-drains-closeup')],
    featureTitle: 'Start with the condition of the pipe.', featureBody: 'Inspection and access details inform whether a lining approach should be considered. No method or outcome is guaranteed by this preview.', featureImage: image('sewer-pipe-lining'), featureAlt: 'sewer pipe lining',
    benefits: ['Assess the pipe before selecting a method', 'Consider access and condition', 'Discuss available alternatives', 'Agree the intended scope first'], process: ['Describe the recurring problem', 'Arrange suitable inspection', 'Review findings and options', 'Confirm scope before proceeding'], faqs: commonFAQs,
  },
  'kitchen-plumbing': {
    title: 'Kitchen Plumbing', eyebrow: 'KITCHEN PLUMBING · MELBOURNE', lead: 'Kitchen Plumbing', highlight: 'Melbourne', description: services.find(s => s.slug === 'kitchen-plumbing')!.description,
    image: image('kitchen-plumbing'), imageAlt: 'kitchen sink plumbing', introTitle: 'Kitchen plumbing support.', introBody: 'Share which fixture is affected, whether there is a leak and what access is available beneath the sink or bench.',
    cards: [card('Sink and mixer', 'Enquiries about taps, mixers and sink connections.', 'kitchen-plumbing'), card('Leaks beneath the bench', 'Tell us where moisture is visible and when it appears.', 'leak-detection'), card('Waste and drainage', 'Slow drainage or odours may need investigation.', 'blocked-drains-closeup')],
    featureTitle: 'Practical help around the kitchen.', featureBody: 'The repair depends on the fixture, connections and cause of the problem. We clarify the proposed work before it proceeds.', featureImage: image('bathroom-inspection'), featureAlt: 'plumbing inspection',
    benefits: ['Identify the affected fitting', 'Note when the leak appears', 'Keep the area accessible if safe', 'Discuss the repair before proceeding'], process: ['Describe the kitchen issue', 'Assess the fitting and connections', 'Explain proposed work', 'Complete and check agreed work'], faqs: commonFAQs,
  },
  'bathroom-plumbing': {
    title: 'Bathroom Plumbing', eyebrow: 'BATHROOM PLUMBING · MELBOURNE', lead: 'Bathroom Plumbing', highlight: 'Melbourne', description: services.find(s => s.slug === 'bathroom-plumbing')!.description,
    image: image('bathroom-shower'), imageAlt: 'bathroom shower and fittings', introTitle: 'Bathroom fixtures and connections.', introBody: 'Tell us which fixture is affected and whether the issue involves a leak, low flow, drainage or a connection.',
    cards: [card('Shower and bath', 'Enquiries about leaks, mixers and water connections.', 'bathroom-shower'), card('Basins and taps', 'Share the fitting and what it is doing.', 'bathroom-inspection'), card('Bathroom drainage', 'Slow or blocked drains need the cause assessed.', 'blocked-drains-closeup')],
    featureTitle: 'Careful work around finished spaces.', featureBody: 'Access and the source of the issue shape the work required. We discuss the proposed scope before beginning.', featureImage: image('bathroom-toilet-technician'), featureAlt: 'bathroom plumbing work',
    benefits: ['Describe the fixture and symptom', 'Note any visible moisture', 'Share access constraints', 'Review options before work starts'], process: ['Discuss the bathroom concern', 'Assess the fixture and connections', 'Explain scope and price', 'Complete and check agreed work'], faqs: commonFAQs,
  },
  'leak-detection': {
    title: 'Leak Detection', eyebrow: 'LEAK DETECTION · MELBOURNE', lead: 'Leak Detection', highlight: 'Melbourne', description: services.find(s => s.slug === 'leak-detection')!.description,
    image: image('leak-detection'), imageAlt: 'leak-detection inspection', introTitle: 'Investigate a suspected leak.', introBody: 'Tell us where moisture appears, how long it has been present and whether the water meter or fixtures have changed.',
    cards: [card('Visible water leaks', 'Share the location and when water is present.', 'burst-copper-pipe'), card('Hidden leak concerns', 'Staining or dampness may need targeted assessment.', 'leak-detection'), card('Inspection options', 'The appropriate method depends on the property and symptoms.', 'bathroom-inspection')],
    featureTitle: 'Trace the signs before choosing a repair.', featureBody: 'Visible moisture can travel from its source. Assessment helps clarify what should be investigated and repaired.', featureImage: image('drain-inspection'), featureAlt: 'plumbing inspection',
    benefits: ['Describe the first sign you noticed', 'Point out nearby fixtures or pipes', 'Keep clear of electrical hazards', 'Discuss next steps before work begins'], process: ['Record the signs and location', 'Assess access and likely sources', 'Discuss investigation options', 'Review findings and repair scope'], faqs: commonFAQs,
  },
  'commercial-plumbing': {
    title: 'Commercial Plumbing', eyebrow: 'COMMERCIAL PLUMBING · MELBOURNE', lead: 'Commercial Plumbing', highlight: 'Melbourne', description: services.find(s => s.slug === 'commercial-plumbing')!.description,
    image: image('emergency-plumber-working'), imageAlt: 'commercial plumbing service image', introTitle: 'Plumbing for commercial properties.', introBody: 'Enquiries for offices, shops, hospitality, facilities and managed properties. Share the site access and operational requirements when you call.',
    cards: [card('Maintenance enquiries', 'Describe the fixtures or systems that need attention.', 'bathroom-inspection'), card('Urgent plumbing', 'Call to discuss the issue, property and current availability.', 'emergency-plumber-working', '/emergency-plumbing/'), card('Drainage and pipework', 'Recurring issues may need investigation before a repair plan.', 'sewer-pipe-lining')],
    featureTitle: 'Scope that fits the site.', featureBody: 'Property use, access windows and affected services all matter. We discuss the site requirements and proposed work before proceeding.', featureImage: image('team-brand-concept'), featureAlt: 'Commercial service image',
    benefits: ['Share site and access details', 'Identify affected facilities', 'Discuss timing and scope', 'Confirm pricing before work proceeds'], process: ['Describe the property issue', 'Review site and access information', 'Discuss scope and scheduling', 'Complete and explain agreed work'], faqs: commonFAQs,
  },
}

const serviceImages: Record<string, string> = {
  'emergency-plumbing': 'hero-plumber-under-sink',
  'blocked-drains': 'blocked-drains-closeup',
  'hot-water-systems': 'hot-water-cylinder',
  'burst-pipe-repairs': 'burst-copper-pipe',
  'toilet-repairs': 'toilet-repairs',
  'gas-plumbing': 'gas-plumbing',
  'sewer-repairs': 'drain-inspection',
  'pipe-relining': 'sewer-pipe-lining',
  'kitchen-plumbing': 'kitchen-plumbing',
  'bathroom-plumbing': 'bathroom-shower',
  'leak-detection': 'leak-detection',
  'commercial-plumbing': 'emergency-plumber-working',
}
export const serviceList = services.map(service => ({ ...service, image: image(serviceImages[service.slug] || 'bathroom-inspection') }))

export const Gallery: (PageCard & { category: string })[] = [
  { title: 'Emergency plumbing', body: 'Plumbing service image.', image: image('emergency-plumber-working'), category: 'General service' },
  { title: 'Drain inspection', body: 'Plumbing service image.', image: image('drain-inspection'), category: 'Drainage' },
  { title: 'Blocked drain', body: 'Plumbing service image.', image: image('blocked-drains-closeup'), category: 'Drainage' },
  { title: 'Hot-water system', body: 'Plumbing service image.', image: image('hot-water-cylinder'), category: 'Hot water' },
  { title: 'Hot-water service', body: 'Plumbing service image.', image: image('hot-water-service'), category: 'Hot water' },
  { title: 'Kitchen plumbing', body: 'Plumbing service image.', image: image('kitchen-plumbing'), category: 'Kitchen & bathroom' },
  { title: 'Bathroom inspection', body: 'Plumbing service image.', image: image('bathroom-inspection'), category: 'Kitchen & bathroom' },
  { title: 'Bathroom fixture', body: 'Plumbing service image.', image: image('bathroom-toilet-technician'), category: 'Kitchen & bathroom' },
  { title: 'Burst copper pipe', body: 'Plumbing service image.', image: image('burst-copper-pipe'), category: 'Pipework' },
  { title: 'Pipe relining', body: 'Plumbing service image.', image: image('sewer-pipe-lining'), category: 'Drainage' },
  { title: 'Leak inspection', body: 'Plumbing service image.', image: image('leak-detection'), category: 'Pipework' },
  { title: 'Service visit', body: 'Plumbing service image.', image: image('plumber-at-door'), category: 'General service' },
]

export const areaRegions = [
  { title: 'Melbourne & inner suburbs', suburbs: ['West Melbourne', 'North Melbourne', 'East Melbourne', 'Carlton', 'Southbank', 'Docklands', 'South Wharf', 'South Melbourne', 'Fitzroy', 'Collingwood', 'Richmond', 'Port Melbourne', 'Botanic Hill'] },
  { title: 'Northern suburbs', suburbs: ['Brunswick', 'Preston', 'Coburg', 'Reservoir', 'Epping'] },
  { title: 'Western suburbs', suburbs: ['Footscray', 'Sunshine', 'St Albans', 'Werribee'] },
  { title: 'Eastern suburbs', suburbs: ['Doncaster', 'Hawthorn', 'Glen Waverley', 'Ringwood'] },
  { title: 'South & bayside', suburbs: ['Moorabbin', 'Cheltenham', 'Dandenong', 'Frankston'] },
]

export const commonServiceFAQ = commonFAQs

