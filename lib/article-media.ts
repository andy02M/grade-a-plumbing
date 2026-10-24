type ArticleMediaInput = {title: string; slug: string; heroImage?: string; heroImageAlt?: string};

// Title/slug intent takes precedence over broad related-service links. Assign at
// the data boundary so cards, article heroes and social/schema images agree.
export function withArticleMedia<T extends ArticleMediaInput>(article: T): T {
  if (article.heroImage) return article;
  const intent = `${article.title} ${article.slug}`.toLowerCase();
  let image: string | undefined;
  let alt = '';
  if (/rainwater|water tank/.test(intent)) {
    image = 'rainwater-garden-v1'; alt = 'Illustrative rainwater tank beside a house in a garden';
  } else if (/washing.machine|laundry/.test(intent)) {
    image = 'laundry-connections-v1'; alt = 'Illustrative laundry with washing machine, wall taps and utility sink';
  } else if (/bathroom|taps.and.showers/.test(intent)) {
    image = 'bathroom-planning-v1'; alt = 'Illustrative bathroom with basin, shower and renovation material samples';
  } else if (/hot.water|heat.pump/.test(intent)) {
    image = 'heat-pump-garden-v1'; alt = 'Illustrative outdoor hot water equipment beside a brick house';
  }
  return image ? {...article, heroImage: `/images/plumbing-advice/generated/${image}.webp`, heroImageAlt: alt} : article;
}
