import type { FaqItem } from "./site";

export type DetailItem = {
  title: string;
  text: string;
};

export type ServicePageContent = {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  breadcrumb: string;
  heroBadge: string;
  heroTitle: string;
  heroText: string;
  primaryCtaLabel?: string;
  introTitle: string;
  introText: string;
  problemTitle: string;
  problems: DetailItem[];
  helpTitle: string;
  helpText: string;
  helpItems: DetailItem[];
  faq: FaqItem[];
  ctaTitle: string;
  ctaText: string;
};

export const emergencyPlumbingPage: ServicePageContent = {
  slug: "/emergency-plumbing-melbourne",
  seoTitle: "Emergency Plumbing Melbourne | Grade A Plumbing",
  metaDescription:
    "Need emergency plumbing in Melbourne, St Kilda, South Melbourne, or Richmond? Grade A Plumbing provides fast help for burst pipes, blocked drains, leaks, hot water issues, and urgent plumbing problems.",
  keywords: [
    "emergency plumbing Melbourne",
    "emergency plumber Melbourne",
    "24 hour plumber Melbourne",
    "urgent plumber Melbourne",
    "burst pipe plumber Melbourne",
    "emergency plumber St Kilda",
    "emergency plumber South Melbourne",
    "emergency plumber Richmond"
  ],
  breadcrumb: "Emergency Plumbing Melbourne",
  heroBadge: "Emergency Plumbing Melbourne",
  heroTitle: "Emergency plumber support across Melbourne",
  heroText:
    "Burst pipe, blocked toilet, major leak, overflowing drain or no hot water? Call Grade A Plumbing for urgent plumbing help across Melbourne VIC, St Kilda, South Melbourne, Richmond, and surrounding suburbs.",
  introTitle: "Urgent plumbing issues need calm, practical action",
  introText:
    "Plumbing emergencies can damage flooring, cabinetry, walls, stock, appliances, and day-to-day routines. We help Melbourne, St Kilda, South Melbourne, and Richmond homes and businesses get the issue assessed quickly, contained where possible, and repaired with clear communication.",
  problemTitle: "Common emergency plumbing problems",
  problems: [
    {
      title: "Burst pipes",
      text: "A burst pipe can release water fast and cause damage quickly. Turn off the water supply if safe, then call for urgent plumbing assistance."
    },
    {
      title: "Blocked toilets",
      text: "Blocked toilets can become unhygienic and disruptive, especially in busy homes, rental properties, cafes, offices, and retail spaces."
    },
    {
      title: "Blocked drains",
      text: "Overflowing or slow drains may indicate a blockage in the line, tree root intrusion, stormwater trouble, or a deeper sewer issue."
    },
    {
      title: "Major leaks",
      text: "Leaks under sinks, behind walls, in ceilings, or around fixtures should be checked before moisture spreads further."
    },
    {
      title: "No hot water",
      text: "A hot water failure can affect showers, cleaning, hospitality operations, and workplace amenities."
    },
    {
      title: "Gas leaks",
      text: "If you suspect a gas leak, keep away from ignition sources, ventilate if safe, and contact the relevant emergency service or gas authority immediately."
    },
    {
      title: "Overflowing drains",
      text: "Overflowing external drains, floor wastes, or stormwater systems can create property damage and safety concerns."
    }
  ],
  helpTitle: "Why urgent plumbing should not wait",
  helpText:
    "Delaying urgent plumbing work can allow water, wastewater, or gas-related hazards to worsen. A prompt assessment helps reduce damage, restore essential services, and give you a clear next step.",
  helpItems: [
    {
      title: "Protect your property",
      text: "Fast action can reduce moisture damage to floors, cabinets, walls, ceilings, stock, and equipment."
    },
    {
      title: "Reduce health and safety risks",
      text: "Overflowing drains, blocked toilets, and gas concerns should be treated seriously and handled with the right precautions."
    },
    {
      title: "Get clear pricing",
      text: "Once the issue can be assessed, we explain the work required and provide clear pricing before proceeding."
    }
  ],
  faq: [
    {
      question: "What counts as a plumbing emergency?",
      answer:
        "Burst pipes, major leaks, overflowing drains, blocked toilets, no hot water, and suspected gas leaks can all be urgent plumbing issues depending on the property and risk involved."
    },
    {
      question: "Can you help with a burst pipe in Melbourne?",
      answer:
        "Yes. Call Grade A Plumbing and, if safe, turn off the main water supply while you wait for advice or attendance."
    },
    {
      question: "Do you help with blocked drains after hours?",
      answer:
        "Emergency availability depends on scheduling and demand. Call 03 4421 6259 and we will confirm the soonest available option."
    },
    {
      question: "What should I do if I smell gas?",
      answer:
        "Avoid flames, switches, and ignition sources. Ventilate if safe, leave the area if needed, and contact the appropriate emergency service or gas authority immediately."
    }
  ],
  ctaTitle: "Need urgent plumbing help in Melbourne?",
  ctaText:
    "Call Grade A Plumbing now or send a quote request and we will respond with the clearest available next step."
};

export const blockedDrainsPage: ServicePageContent = {
  slug: "/blocked-drains-melbourne",
  seoTitle: "Blocked Drains Melbourne | Drain Plumber Melbourne",
  metaDescription:
    "Blocked drain plumber in Melbourne, St Kilda, South Melbourne, and Richmond. Grade A Plumbing helps clear blocked sinks, toilets, stormwater drains, sewer drains, and slow draining pipes.",
  keywords: [
    "blocked drains Melbourne",
    "blocked drain plumber Melbourne",
    "drain plumber Melbourne",
    "blocked toilet Melbourne",
    "sewer blockage Melbourne",
    "blocked drains St Kilda",
    "blocked drains South Melbourne",
    "blocked drains Richmond"
  ],
  breadcrumb: "Blocked Drains Melbourne",
  heroBadge: "Drain Plumber Melbourne",
  heroTitle: "Blocked drains cleared across Melbourne",
  heroText:
    "Slow draining sink, blocked toilet, sewer smell, stormwater backup or gurgling pipes? Grade A Plumbing helps Melbourne, St Kilda, South Melbourne, and Richmond properties get drains flowing again.",
  introTitle: "Blocked drains are more than an inconvenience",
  introText:
    "A blockage can start as slow drainage and quickly become overflow, bad odours, water damage, or an unusable bathroom, kitchen, laundry, or commercial facility.",
  problemTitle: "Signs of blocked drains",
  problems: [
    {
      title: "Slow draining sinks and showers",
      text: "Water pooling or draining slowly can be an early sign of a blockage building up inside the pipework."
    },
    {
      title: "Blocked toilet",
      text: "Toilets that fill, drain slowly, or overflow may indicate a local blockage or a deeper sewer line issue."
    },
    {
      title: "Gurgling sounds",
      text: "Gurgling drains can suggest trapped air caused by restricted flow within the drainage system."
    },
    {
      title: "Bad smells",
      text: "Odours around drains, bathrooms, laundries, and outdoor drainage points can point to wastewater build-up."
    },
    {
      title: "Outdoor overflow",
      text: "Overflowing inspection openings, stormwater pits, or surface drains need attention before damage spreads."
    }
  ],
  helpTitle: "Common causes of blocked drains",
  helpText:
    "The right repair depends on what is causing the blockage. We help identify likely causes and explain the best way to clear the drain and reduce repeat problems.",
  helpItems: [
    {
      title: "Tree roots",
      text: "Roots can enter cracked or ageing pipes and create stubborn blockages that keep coming back."
    },
    {
      title: "Grease build up",
      text: "Grease, fats, soap residue, and food waste can narrow kitchen and commercial drainage lines."
    },
    {
      title: "Foreign objects",
      text: "Wipes, sanitary products, toys, packaging, and other items can lodge in toilets and drains."
    },
    {
      title: "Old pipes",
      text: "Older pipework may sag, crack, corrode, or shift, causing recurring drainage problems."
    },
    {
      title: "Stormwater issues",
      text: "Leaves, silt, roof debris, and heavy rain can overload or block stormwater systems."
    }
  ],
  faq: [
    {
      question: "Can you clear a blocked toilet in Melbourne?",
      answer:
        "Yes. We help with blocked toilets, slow draining toilets, and toilet overflows across Melbourne and surrounding suburbs."
    },
    {
      question: "What causes blocked drains?",
      answer:
        "Common causes include tree roots, grease build-up, foreign objects, old or damaged pipes, and stormwater debris."
    },
    {
      question: "Should I keep using chemical drain cleaners?",
      answer:
        "Chemical cleaners may not fix the underlying problem and can be unsuitable for some pipework. A plumber can assess the blockage and recommend the right approach."
    },
    {
      question: "Can stormwater drains be cleared?",
      answer:
        "Yes. Stormwater issues can often be assessed and cleared depending on access, pipe condition, and the cause of the blockage."
    }
  ],
  ctaTitle: "Need a blocked drain plumber in Melbourne?",
  ctaText:
    "Call Grade A Plumbing or request a free quote for blocked drains, toilets, sewer lines, and stormwater plumbing."
};

export const hotWaterPage: ServicePageContent = {
  slug: "/hot-water-repairs-melbourne",
  seoTitle: "Hot Water Repairs Melbourne | Grade A Plumbing",
  metaDescription:
    "Hot water problems in Melbourne, St Kilda, South Melbourne, or Richmond? Grade A Plumbing helps with hot water repairs, leaking systems, no hot water, and plumbing maintenance.",
  keywords: [
    "hot water repairs Melbourne",
    "hot water plumber Melbourne",
    "no hot water Melbourne",
    "hot water system plumber Melbourne",
    "hot water repairs St Kilda",
    "hot water plumber South Melbourne",
    "hot water plumber Richmond"
  ],
  breadcrumb: "Hot Water Repairs Melbourne",
  heroBadge: "Hot Water Plumber Melbourne",
  heroTitle: "Hot water plumbing help across Melbourne",
  heroText:
    "No hot water, a leaking unit, low pressure, strange noises or inconsistent temperature? Grade A Plumbing helps Melbourne, St Kilda, South Melbourne, and Richmond homes and businesses get practical hot water support.",
  introTitle: "A reliable hot water system matters every day",
  introText:
    "Hot water faults disrupt showers, cleaning, laundry, commercial kitchens, and staff amenities. We help diagnose the issue and explain repair or replacement options clearly.",
  problemTitle: "Common hot water issues",
  problems: [
    {
      title: "No hot water",
      text: "A complete loss of hot water may relate to the system, valves, power or gas supply, thermostat, or other plumbing components."
    },
    {
      title: "Leaking unit",
      text: "Leaks around a hot water system should be checked to prevent property damage and determine whether repair is viable."
    },
    {
      title: "Low pressure",
      text: "Weak hot water pressure can affect showers, taps, commercial sinks, and cleaning areas."
    },
    {
      title: "Strange noises",
      text: "Banging, rumbling, hissing, or popping sounds may point to internal build-up, pressure issues, or system wear."
    },
    {
      title: "Temperature issues",
      text: "Water that is too hot, too cold, or fluctuating can be uncomfortable and may indicate a fault that needs attention."
    }
  ],
  helpTitle: "Repair versus replacement guidance",
  helpText:
    "Not every hot water issue needs a full replacement. We help you weigh the age, condition, fault, safety, running costs, and repair value before choosing the next step.",
  helpItems: [
    {
      title: "Repair where sensible",
      text: "If the system is in reasonable condition and the fault is repairable, a targeted repair may be the best option."
    },
    {
      title: "Replace when value is poor",
      text: "If the unit is old, leaking, unreliable, or costly to repair, replacement may be the more practical long-term path."
    },
    {
      title: "Clear advice before work",
      text: "We explain what we find, what the options are, and what pricing applies before proceeding wherever possible."
    }
  ],
  faq: [
    {
      question: "Why do I have no hot water?",
      answer:
        "No hot water may be caused by a system fault, valve issue, power or gas supply problem, thermostat issue, leak, or worn component. A plumber can help narrow it down."
    },
    {
      question: "Can a leaking hot water unit be repaired?",
      answer:
        "Some leaks can be repaired, while others indicate a system nearing the end of its service life. We can inspect and explain the practical options."
    },
    {
      question: "Do you help with low hot water pressure?",
      answer:
        "Yes. Low pressure can be caused by valves, pipework, the system itself, or restrictions in the plumbing."
    },
    {
      question: "Should I repair or replace my hot water system?",
      answer:
        "It depends on the system age, fault, repair cost, and reliability. We provide practical guidance so you can make an informed decision."
    }
  ],
  ctaTitle: "Hot water not working properly?",
  ctaText:
    "Call Grade A Plumbing or request a free quote for hot water repairs and plumbing support across Melbourne."
};

export const commercialPlumbingPage: ServicePageContent = {
  slug: "/commercial-plumbing-melbourne",
  seoTitle: "Commercial Plumbing Melbourne | Grade A Plumbing",
  metaDescription:
    "Commercial plumbing services in Melbourne, South Melbourne, Richmond, and nearby inner suburbs for offices, shops, restaurants, warehouses, property managers, and local businesses.",
  keywords: [
    "commercial plumbing Melbourne",
    "commercial plumber Melbourne",
    "plumbing services Melbourne",
    "business plumber Melbourne",
    "commercial plumber South Melbourne",
    "commercial plumber Richmond",
    "plumber Melbourne CBD"
  ],
  breadcrumb: "Commercial Plumbing Melbourne",
  heroBadge: "Commercial Plumber Melbourne",
  heroTitle: "Commercial plumbing for Melbourne businesses",
  heroText:
    "Grade A Plumbing supports offices, shops, cafes, restaurants, warehouses, clinics, property managers, and local businesses across Melbourne CBD, South Melbourne, Richmond, St Kilda, and nearby suburbs with clear, reliable plumbing services.",
  introTitle: "Plumbing that respects your site, staff, and customers",
  introText:
    "Commercial plumbing needs good communication, tidy work, and practical scheduling. We help keep essential facilities working with maintenance, repairs, and emergency support where available.",
  problemTitle: "Industries served",
  problems: [
    {
      title: "Offices",
      text: "Support for bathrooms, kitchens, hot water, leaks, blockages, and maintenance plumbing in office environments."
    },
    {
      title: "Restaurants and cafes",
      text: "Plumbing help for sinks, drains, hot water, fixtures, leaks, and urgent issues that disrupt service."
    },
    {
      title: "Retail shops",
      text: "Reliable plumbing support for shop amenities, staff areas, customer bathrooms, and tenancy requirements."
    },
    {
      title: "Warehouses",
      text: "Maintenance and repair support for commercial facilities, staff amenities, drainage, and general plumbing."
    },
    {
      title: "Medical clinics",
      text: "Careful communication and respectful service for clinics that need plumbing work handled professionally."
    },
    {
      title: "Property managers",
      text: "Clear updates, tenant-aware communication, and practical plumbing support for managed properties."
    },
    {
      title: "Real estate agencies",
      text: "Assistance with rental plumbing repairs, urgent tenant issues, pre-sale plumbing items, and maintenance work."
    }
  ],
  helpTitle: "Maintenance services and emergency support",
  helpText:
    "From small repairs to urgent faults, commercial sites need plumbers who can communicate clearly and work with the realities of trading hours, tenants, staff, and building access.",
  helpItems: [
    {
      title: "Planned maintenance",
      text: "Practical maintenance for taps, toilets, drains, hot water, leaks, and general plumbing items."
    },
    {
      title: "Responsive repairs",
      text: "Support for plumbing problems that disrupt trading, staff amenities, or tenant comfort."
    },
    {
      title: "Clear site communication",
      text: "We explain what is happening, what access is needed, and what the recommended next step is."
    }
  ],
  faq: [
    {
      question: "Do you service offices and retail shops?",
      answer:
        "Yes. Grade A Plumbing works with offices, retail shops, cafes, restaurants, warehouses, clinics, and managed properties across Melbourne."
    },
    {
      question: "Can you help property managers?",
      answer:
        "Yes. We can assist property managers and real estate agencies with tenant plumbing repairs, maintenance, and urgent issues."
    },
    {
      question: "Do you offer commercial plumbing maintenance?",
      answer:
        "Yes. We help with planned and reactive maintenance for taps, toilets, drains, hot water, leaks, and general plumbing issues."
    },
    {
      question: "Can commercial plumbing work be scheduled around business hours?",
      answer:
        "We will discuss access, urgency, and practical timing with you. Availability depends on the job, location, and schedule."
    }
  ],
  ctaTitle: "Need a commercial plumber in Melbourne?",
  ctaText:
    "Call Grade A Plumbing or request a free quote for commercial plumbing services across Melbourne."
};

export const servicePages = [
  emergencyPlumbingPage,
  blockedDrainsPage,
  hotWaterPage,
  commercialPlumbingPage
] as const;
