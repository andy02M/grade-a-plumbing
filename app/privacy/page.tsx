import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy | Grade A Plumbing", description: "How Grade A Plumbing handles enquiries, website measurement and connected Google Business Profile data." };

export default function PrivacyPage() {
  return <PolicyPage title="Privacy Policy" updated="2 October 2026">
    <section><h2>Website enquiries</h2><p>Details you provide in a quote form are used to respond to your plumbing enquiry and are sent through our email service to our support and booking recipients. Do not include sensitive information that is unnecessary for the enquiry.</p></section>
    <section><h2>Website measurement</h2><p>We record limited first-party measurement events for call and email link clicks, accepted quote submissions and browser performance. Measurement records contain an allowlisted page category, configured location and, where relevant, a service or article identifier and performance value. We do not include form contents, names, phone numbers, email addresses, full URLs, query strings or visitor identifiers in these measurement records. This measurement does not set tracking cookies or load third-party analytics scripts. Browser Do Not Track and Global Privacy Control signals are respected for measurement. Our hosting provider may separately process request information for security and operational logs, subject to its retention settings.</p></section>
    <section><h2>Information we collect</h2><p>When you sign in or connect an account, we receive your Google account identifier, email address, display name and profile image. With your permission, we access the Google Business Profile accounts and locations that the connected account manages. We also store templates, scheduled posts, profile settings, publishing results and operational logs you create in the service.</p></section>
    <section><h2>How Google user data is used</h2><p>Google user data is used only to provide visible GMB AutoPilot features: connecting accounts, listing managed Business Profiles, creating drafts, scheduling posts, publishing approved content, and showing publishing status. We do not sell Google user data, use it for advertising, or use it to train general-purpose AI models.</p></section>
    <section><h2>Storage and security</h2><p>OAuth refresh tokens are encrypted before storage. Access is scoped to the signed-in workspace. We use reasonable technical and organisational controls, but no internet service can guarantee absolute security.</p></section>
    <section><h2>Sharing</h2><p>We transmit data to Google only as needed to perform actions you request. Service providers may process limited data for hosting, database, security and operational support under contractual obligations. We do not disclose Google user data to unrelated third parties except when required by law.</p></section>
    <section><h2>Retention, revocation and deletion</h2><p>We retain connected-account and automation data while your workspace is active or as needed to provide the service. You can revoke access from your Google Account permissions. You can request deletion using the instructions on our Data Deletion page.</p></section>
    <section><h2>Google API Services User Data Policy</h2><p>Our use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including its Limited Use requirements.</p></section>
    <section><h2>Contact</h2><p>Questions can be sent to <a className="text-blue-700 underline" href={site.emailHref}>{site.email}</a>.</p></section>
  </PolicyPage>;
}
