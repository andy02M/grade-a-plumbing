import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Data Deletion | GMB AutoPilot" };

export default function DataDeletionPage() {
  return <PolicyPage title="Data Deletion" updated="18 September 2026">
    <section><h2>Revoke Google access</h2><p>You may immediately stop future Google API access by removing GMB AutoPilot from the third-party connections page in your Google Account.</p></section>
    <section><h2>Request deletion</h2><p>Email <a className="text-blue-700 underline" href={`${site.emailHref}?subject=GMB%20AutoPilot%20data%20deletion%20request`}>{site.email}</a> from the workspace owner email. Include the subject “GMB AutoPilot data deletion request”. We may ask you to verify ownership before deleting data.</p></section>
    <section><h2>What is deleted</h2><p>After verification, we will delete connected-account tokens, imported profile records, templates, scheduled posts, profile drafts and workspace activity records, except information we must retain for legal, fraud-prevention or security purposes.</p></section>
    <section><h2>Timing</h2><p>We aim to complete verified deletion requests within 30 days and will confirm when the request has been processed.</p></section>
  </PolicyPage>;
}
