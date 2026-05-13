import { ServicePage } from "@/components/ServicePage";
import { emergencyPlumbingPage } from "@/lib/service-pages";
import {
  breadcrumbSchema,
  createMetadata,
  faqSchema,
  JsonLd,
  localBusinessSchema,
  serviceSchema
} from "@/lib/seo";

export const metadata = createMetadata({
  title: emergencyPlumbingPage.seoTitle,
  description: emergencyPlumbingPage.metaDescription,
  path: emergencyPlumbingPage.slug,
  keywords: emergencyPlumbingPage.keywords
});

export default function EmergencyPlumbingMelbournePage() {
  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(),
          serviceSchema({
            name: "Emergency Plumbing Melbourne",
            description: emergencyPlumbingPage.metaDescription,
            path: emergencyPlumbingPage.slug,
            serviceType: "Emergency plumbing"
          }),
          faqSchema(emergencyPlumbingPage.faq),
          breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: emergencyPlumbingPage.breadcrumb, href: emergencyPlumbingPage.slug }
          ])
        ]}
      />
      <ServicePage content={emergencyPlumbingPage} />
    </>
  );
}
