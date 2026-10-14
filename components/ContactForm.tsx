"use client";
import { QuoteForm } from "./manus/components";
export function ContactForm({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <div data-tone={tone}>
      <QuoteForm compact={compact} />
    </div>
  );
}
