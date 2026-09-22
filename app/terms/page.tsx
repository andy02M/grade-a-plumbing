import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service | GMB AutoPilot" };

export default function TermsPage() {
  return <PolicyPage title="Terms of Service" updated="18 September 2026">
    <section><h2>Using the service</h2><p>You must own or be authorised to manage every Google Business Profile you connect. You are responsible for the accuracy, legality and policy compliance of business information, images, posts and templates submitted through GMB AutoPilot.</p></section>
    <section><h2>Google policies</h2><p>You must comply with Google&apos;s Business Profile, OAuth and API policies. GMB AutoPilot does not guarantee profile verification, publication, ranking, availability or approval by Google.</p></section>
    <section><h2>Account security</h2><p>You are responsible for safeguarding access to your workspace and connected Google accounts. Notify us promptly if you suspect unauthorised access.</p></section>
    <section><h2>Acceptable use</h2><p>Do not use the service for deceptive listings, impersonation, spam, unlawful content, duplicate profiles that violate Google policy, or access to profiles you are not authorised to manage.</p></section>
    <section><h2>Availability and liability</h2><p>The service is provided on an as-available basis. Google may change its interfaces, APIs, quotas or policies. To the extent permitted by law, we are not liable for indirect loss, lost rankings, rejected profiles or interrupted publishing caused by third-party services.</p></section>
    <section><h2>Contact</h2><p>Questions about these terms can be sent to <a className="text-blue-700 underline" href={site.emailHref}>{site.email}</a>.</p></section>
  </PolicyPage>;
}
