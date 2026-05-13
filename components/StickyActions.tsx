import { site } from "@/lib/site";
import { Icon } from "./Icon";

export function StickyActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 p-3 shadow-[0_-14px_35px_rgba(8,33,63,0.12)] backdrop-blur md:hidden">
      <a
        className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-blue px-4 py-3 text-sm font-black text-white"
        href={site.phoneHref}
      >
        <Icon name="phone" className="h-4 w-4" />
        Call Now: {site.phone}
      </a>
    </div>
  );
}
