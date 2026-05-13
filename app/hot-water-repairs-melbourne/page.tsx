import { ServicePage } from "@/components/ServicePage";
import { hotWaterPage } from "@/lib/service-pages";
import {
  breadcrumbSchema,
  createMetadata,
  faqSchema,
  JsonLd,
  localBusinessSchema,
  serviceSchema
} from "@/lib/seo";

export const metadata = createMetadata({
  title: hotWaterPage.seoTitle,
  description: hotWaterPage.metaDescription,
  path: hotWaterPage.slug,
  keywords: hotWaterPage.keywords
});

export default function HotWaterRepairsMelbournePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema({
            name: "Hot Water Repairs Melbourne",
            description: hotWaterPage.metaDescription,
            path: hotWaterPage.slug,
            serviceType: "Hot water plumbing"
          }),
          faqSchema(hotWaterPage.faq),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: hotWaterPage.breadcrumb, href: hotWaterPage.slug }
          ])
        ]}
      />
      <ServicePage content={hotWaterPage} />
    </>
  );
}
