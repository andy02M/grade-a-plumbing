# Customer review import — 25 October 2026

Source: owner-provided `8e7888ab-3757-4d84-8890-a1497cf31434/Pasted text.txt`. The owner states these are all five-star reviews; no independent Google verification is claimed.

Imported all **191 distinct entries** across 37 supplied sections: **172 written testimonials and 19 rating-only entries**. No exact name/text duplicates were detected. The importer handles quoted multiline cells and preserves supplied wording, including any place names occurring naturally inside the testimonial. It does not display or store suburb group headings in the public review dataset. Removing words from testimonials would alter customer quotes, so only separate location labels are omitted.

Public review cards show reviewer name, five stars and supplied text where present. No fabricated testimonial for blank cells, price badge, location attribution or Maps link is added. Existing older excerpts are replaced by this fuller supplied collection rather than duplicated. Review structured data and the separate owner-confirmed business-wide rating total are unchanged.

The owner subsequently confirmed genuine review ages in supplied order: first 50 two months ago, next 50 one month ago, next 50 three weeks ago, remaining 41 one week ago. These labels are explicitly referenced to 25 October 2026 on the page, not rolling claims of permanent recency or independently verified exact publication timestamps.

Re-import command: `node scripts/import-supplied-reviews.mjs <source-file>`. The generated public data is `data/supplied-customer-reviews.json`.

Implemented locally on the SEO branch. No production publication is authorised by this import request alone.
