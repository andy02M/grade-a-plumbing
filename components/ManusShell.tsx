"use client";
import { useEffect, useRef } from "react";
import { Header, Footer, MobileActions, QuoteForm } from "./manus/components";
import GradeAWhatsAppWidget from "./GradeAWhatsAppWidget";
import { site } from "@/lib/site";
export function ManusShell({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener("open-quote", open);
    return () => window.removeEventListener("open-quote", open);
  }, []);
  return (
    <div className="app">
      <Header />
      <div>{children}</div>
      <Footer />
      <MobileActions />
      <GradeAWhatsAppWidget
        whatsAppNumber={site.whatsAppNumber}
        businessName={site.name}
        onRequestCallback={() => window.dispatchEvent(new Event("open-quote"))}
      />
      <dialog
        ref={dialog}
        className="manus-quote-dialog"
        aria-label="Request a quote"
      >
        <button
          type="button"
          aria-label="Close quote form"
          onClick={() => dialog.current?.close()}
        >
          Close ×
        </button>
        <QuoteForm />
      </dialog>
    </div>
  );
}
