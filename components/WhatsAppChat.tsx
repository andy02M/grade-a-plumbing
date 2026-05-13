import { site } from "@/lib/site";

export function WhatsAppChat() {
  return (
    <a
      aria-label="Chat with Grade A Plumbing on WhatsApp"
      className="fixed bottom-24 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#128c7e] px-4 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(18,140,126,0.32)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-[#0f7d71] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#128c7e] md:bottom-6 md:right-6"
      href={site.whatsAppHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.04 2C6.58 2 2.13 6.35 2.13 11.7c0 1.86.55 3.63 1.55 5.17L2 22l5.3-1.63a10.14 10.14 0 0 0 4.74 1.17c5.47 0 9.92-4.35 9.92-9.7S17.51 2 12.04 2Zm0 17.85c-1.51 0-2.98-.4-4.27-1.16l-.31-.18-3.14.97 1-3.01-.2-.31a8.06 8.06 0 0 1-1.31-4.46c0-4.42 3.69-8.02 8.23-8.02s8.23 3.6 8.23 8.02-3.69 8.15-8.23 8.15Zm4.5-6.03c-.25-.12-1.45-.7-1.68-.78-.22-.08-.39-.12-.55.12-.16.24-.63.78-.77.94-.14.16-.28.18-.52.06-.25-.12-1.04-.38-1.98-1.2-.73-.64-1.22-1.43-1.36-1.67-.14-.24-.02-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.3-.76-1.78-.2-.46-.4-.4-.55-.41h-.47c-.16 0-.43.06-.65.3-.22.24-.86.82-.86 2s.88 2.32 1 2.48c.12.16 1.73 2.58 4.19 3.62.59.25 1.04.4 1.4.51.59.18 1.12.16 1.54.1.47-.07 1.45-.58 1.65-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28Z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
