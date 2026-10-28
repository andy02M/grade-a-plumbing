"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { quoteServiceOptions, quoteServiceDefault } from '@/lib/quote-context';

type ContactFormProps = {
  compact?: boolean;
  tone?: "light" | "dark";
  defaultSuburb?: string;
  defaultService?: string;
};

const serviceOptions = quoteServiceOptions;

export function ContactForm({ compact = false, tone = "light", defaultSuburb = '', defaultService = '' }: ContactFormProps) {
  const [suburb,setSuburb] = useState(defaultSuburb);
  const [selectedService,setSelectedService] = useState(quoteServiceDefault(defaultService));
  const suburbEdited = useRef(false);
  const serviceEdited = useRef(false);
  const submissionLock = useRef(false);
  useEffect(() => {if(!suburbEdited.current)setSuburb(defaultSuburb);},[defaultSuburb]);
  useEffect(() => {if(!serviceEdited.current)setSelectedService(quoteServiceDefault(defaultService));},[defaultService]);
  const [submitState, setSubmitState] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
    referenceId?: string;
  }>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dark = tone === "dark";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(submissionLock.current) return;
    submissionLock.current=true;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setSubmitState({ type: "idle" });

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          suburb: String(formData.get("suburb") ?? ""),
          service: String(formData.get("service") ?? ""),
          message: String(formData.get("message") ?? ""),
          source: compact ? "Homepage quote form" : "Contact page quote form"
        })
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        referenceId?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "We could not submit your quote right now.");
      }

      form.reset();
      setSubmitState({
        type: "success",
        message: result.message ?? "Thanks, your enquiry has been sent.",
        referenceId: result.referenceId
      });
    } catch (error) {
      setSubmitState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not submit your quote right now. Please call or email us."
      });
    } finally {
      submissionLock.current=false;
      setIsSubmitting(false);
    }
  }

  if (submitState.type === "success") {
    return (
      <div
        className={`rounded-md border p-5 ${
          dark
            ? "border-white/15 bg-white/10 text-white backdrop-blur"
            : "border-blue-100 bg-brand-sky text-brand-navy"
        }`}
        role="status"
      >
        <p className="font-display text-lg font-black">Thanks, your enquiry has been sent.</p>
        <p className={`mt-2 text-sm leading-6 ${dark ? "text-blue-50" : "text-slate-700"}`}>
          {submitState.message}
        </p>
        {submitState.referenceId ? (
          <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-blue-100" : "text-brand-blue"}`}>
            Reference: {submitState.referenceId}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field dark={dark} label="Name" name="name" placeholder="Your name" required />
        <Field
          dark={dark}
          label="Phone"
          name="phone"
          placeholder="Your phone number"
          required
          type="tel"
        />
        {!compact ? (
          <Field dark={dark} label="Email" name="email" placeholder="you@example.com" type="email" />
        ) : null}
        <Field dark={dark} label="Suburb, state and postcode" name="suburb" placeholder="Suburb, state and postcode" required value={suburb} onChange={value=>{suburbEdited.current=true;setSuburb(value);}} />
      </div>

      <label
        className={`grid gap-2 text-sm font-bold ${dark ? "text-white" : "text-brand-charcoal"}`}
        htmlFor={compact ? "service-needed-compact" : "service-needed"}
      >
        Service needed
        <select
          className={`min-h-12 rounded-md border px-3 text-base font-medium outline-none transition ${
            dark
              ? "border-white/10 bg-white/10 text-white focus:border-white/40 focus:ring-4 focus:ring-white/10"
              : "border-slate-200 bg-white text-brand-charcoal focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
          }`}
          id={compact ? "service-needed-compact" : "service-needed"}
          name="service"
          value={selectedService}
          onChange={event=>{serviceEdited.current=true;setSelectedService(event.target.value);}}
          required
        >
          <option value="">Select a service</option>
          {serviceOptions.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>

      <label className={`grid gap-2 text-sm font-bold ${dark ? "text-white" : "text-brand-charcoal"}`}>
        Tell us more about the issue
        <textarea
          className={`rounded-md border px-3 py-3 text-base font-medium outline-none transition ${
            compact
              ? "min-h-28"
              : "min-h-32"
          } ${
            dark
              ? "border-white/10 bg-white/10 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-4 focus:ring-white/10"
              : "border-slate-200 bg-white text-brand-charcoal focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
          }`}
          name="message"
          placeholder={
            compact
              ? "Add a few details about the plumbing issue, location, or urgency."
              : "Tell us what is happening and how urgent it is."
          }
        />
      </label>

      {submitState.type === "error" ? (
        <p
          className={`rounded-md border px-4 py-3 text-sm ${
            dark
              ? "border-red-300/30 bg-red-500/10 text-red-100"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {submitState.message}
        </p>
      ) : null}

      <details className={`text-sm leading-relaxed ${dark ? "text-blue-100" : "text-brand-charcoal"}`}>
        <summary className="cursor-pointer font-bold">After-hours attendance from 4 pm</summary>
        <div className="mt-2 grid gap-2">
          <p>Attendance from 4:00 PM onwards is considered an after-hours service and is subject to plumber availability and applicable after-hours rates.</p>
          <p>Submitting an enquiry does not guarantee attendance or a specific arrival time. Our team will contact you to confirm availability and appointment details.</p>
          <p>For non-urgent plumbing issues, you may request the next available appointment during standard business hours.</p>
        </div>
      </details>

      <button
        className={`min-h-12 rounded-full px-5 py-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          dark
            ? "bg-white text-brand-navy hover:bg-blue-50 focus-visible:outline-white"
            : "bg-brand-blue text-white shadow-lift hover:bg-blue-700 focus-visible:outline-brand-blue"
        }`}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? "Sending..."
          : compact
            ? "Submit Quote Request"
            : "Request a Free Quote"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  dark = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  dark?: boolean;
  value?: string;
  onChange?: (value:string)=>void;
}) {
  return (
    <label className={`grid gap-2 text-sm font-bold ${dark ? "text-white" : "text-brand-charcoal"}`}>
      {label}
      <input
        className={`min-h-12 rounded-md border px-3 text-base font-medium outline-none transition ${
          dark
            ? "border-white/10 bg-white/10 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-4 focus:ring-white/10"
            : "border-slate-200 bg-white text-brand-charcoal focus:border-brand-blue focus:ring-4 focus:ring-blue-100"
        }`}
        name={name}
        value={value}
        onChange={onChange ? event=>onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
