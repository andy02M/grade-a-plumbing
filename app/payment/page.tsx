import type { Metadata } from "next";
import ManusApp from "@/components/manus/MarketingEntry";
import { getRequestLocation } from "@/lib/location-request";

export async function generateMetadata(): Promise<Metadata> {
  const location = await getRequestLocation();
  return {
    title: "Payment Information | Grade A Plumbing",
    description: "Cash, card and other payment methods accepted. Payment is due on completion. Speak with our team if you need more time to pay.",
    alternates: { canonical: `${location.website}/payment/` },
  };
}

export default function PaymentPage() {
  return <ManusApp initialPath="/payment/" embedded />;
}
