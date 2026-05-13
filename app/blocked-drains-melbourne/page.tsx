import { ServicePage } from "@/components/ServicePage";
import { blockedDrainsPage } from "@/lib/service-pages";
import {
  breadcrumbSchema,
  createMetadata,
  faqSchema,
  JsonLd,
  localBusinessSchema,
  serviceSchema
} from "@/lib/seo";

export const metadata = createMetadata({
  title: blockedDrainsPage.seoTitle,
  description: blockedDrainsPage.metaDescription,
  path: blockedDrainsPage.slug,
  keywords: blockedDrainsPage.keywords
});

export default function BlockedDrainsMelbournePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema({
            name: "Blocked Drains Melbourne",
            description: blockedDrainsPage.metaDescription,
            path: blockedDrainsPage.slug,
            serviceType: "Blocked drain plumbing"
          }),
          faqSchema(blockedDrainsPage.faq),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: blockedDrainsPage.breadcrumb, href: blockedDrainsPage.slug }
          ])
        ]}
      />
      <ServicePage content={blockedDrainsPage} />
    </>
  );
}
