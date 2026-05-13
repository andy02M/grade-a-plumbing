import { NextResponse } from "next/server";
import { site } from "@/lib/site";

export const runtime = "nodejs";

type QuotePayload = {
  name: string;
  phone: string;
  email?: string;
  suburb: string;
  service: string;
  message?: string;
  source?: string;
};

type StoredQuote = QuotePayload & {
  id: string;
  submittedAt: string;
};

const localQuoteSubmissions: StoredQuote[] = [];
const quoteSubmissionError = `We could not submit your quote right now. Please call ${site.phone} or email ${site.email}.`;
const canStoreLocally = process.env.NODE_ENV !== "production";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<QuotePayload>;
    const validationError = validateQuote(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const submission: StoredQuote = {
      id: crypto.randomUUID().slice(0, 8).toUpperCase(),
      submittedAt: new Date().toISOString(),
      name: payload.name!.trim(),
      phone: payload.phone!.trim(),
      email: payload.email?.trim() ?? "",
      suburb: payload.suburb!.trim(),
      service: payload.service!.trim(),
      message: payload.message?.trim() ?? "",
      source: payload.source?.trim() ?? "Website quote form"
    };

    let stored = false;
    let emailed = false;

    if (canStoreLocally) {
      try {
        storeQuote(submission);
        stored = true;
      } catch (error) {
        console.error("Quote storage failed", error);
      }
    }

    try {
      emailed = await sendQuoteEmail(submission);
    } catch (error) {
      console.error("Quote email failed", error);
    }

    if (!stored && !emailed) {
      return NextResponse.json(
        {
          error: quoteSubmissionError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      referenceId: submission.id,
      message:
        "Your free quote request has been received. We will review it and get back to you as soon as possible."
    });
  } catch (error) {
    console.error("Quote submission error", error);

    return NextResponse.json(
      {
        error: quoteSubmissionError
      },
      { status: 500 }
    );
  }
}

function validateQuote(payload: Partial<QuotePayload>) {
  if (!payload.name?.trim()) return "Please enter your name.";
  if (!payload.phone?.trim()) return "Please enter your phone number.";
  if (!payload.suburb?.trim()) return "Please enter your suburb.";
  if (!payload.service?.trim()) return "Please select the plumbing service you need.";

  if (payload.email && payload.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please enter a valid email address.";
  }

  return null;
}

function storeQuote(submission: StoredQuote) {
  localQuoteSubmissions.push(submission);
  console.info("Local quote submission received", {
    referenceId: submission.id,
    totalLocalSubmissions: localQuoteSubmissions.length
  });
}

async function sendQuoteEmail(submission: StoredQuote) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL ?? "Grade A Plumbing Quotes <onboarding@resend.dev>",
      to: [site.email],
      reply_to: submission.email || undefined,
      subject: `New free quote request from ${submission.name}`,
      text: [
        `Reference: ${submission.id}`,
        `Submitted: ${submission.submittedAt}`,
        `Source: ${submission.source}`,
        `Name: ${submission.name}`,
        `Phone: ${submission.phone}`,
        `Email: ${submission.email || "Not provided"}`,
        `Suburb: ${submission.suburb}`,
        `Service: ${submission.service}`,
        `Message: ${submission.message || "No message provided"}`
      ].join("\n"),
      html: `
        <h2>New Grade A Plumbing quote request</h2>
        <p><strong>Reference:</strong> ${escapeHtml(submission.id)}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(submission.submittedAt)}</p>
        <p><strong>Source:</strong> ${escapeHtml(submission.source ?? "")}</p>
        <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(submission.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(submission.email || "Not provided")}</p>
        <p><strong>Suburb:</strong> ${escapeHtml(submission.suburb)}</p>
        <p><strong>Service:</strong> ${escapeHtml(submission.service)}</p>
        <p><strong>Message:</strong><br>${escapeHtml(submission.message || "No message provided").replace(/\n/g, "<br>")}</p>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error: ${errorText}`);
  }

  return true;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
