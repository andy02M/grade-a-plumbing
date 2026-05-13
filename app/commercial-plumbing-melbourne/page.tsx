import { ServicePage } from "@/components/ServicePage";
import { commercialPlumbingPage } from "@/lib/service-pages";
import {
  breadcrumbSchema,
  createMetadata,
  faqSchema,
  JsonLd,
  localBusinessSchema,
  serviceSchema
} from "@/lib/seo";

export const metadata = createMetadata({
  title: commercialPlumbingPage.seoTitle,
  description: commercialPlumbingPage.metaDescription,
  path: commercialPlumbingPage.slug,
  keywords: commercialPlumbingPage.keywords
});

export default function CommercialPlumbingMelbournePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema({
            name: "Commercial Plumbing Melbourne",
            description: commercialPlumbingPage.metaDescription,
            path: commercialPlumbingPage.slug,
            serviceType: "Commercial plumbing"
          }),
          faqSchema(commercialPlumbingPage.faq),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: commercialPlumbingPage.breadcrumb, href: commercialPlumbingPage.slug }
          ])
        ]}
      />
      <ServicePage content={commercialPlumbingPage} />
    </>
  );
}
