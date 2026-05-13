import type { SVGProps } from "react";

export type IconName =
  | "alert"
  | "building"
  | "check"
  | "close"
  | "clock"
  | "drain"
  | "flame"
  | "home"
  | "mail"
  | "menu"
  | "phone"
  | "pipe"
  | "roof"
  | "tap"
  | "water"
  | "wrench";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function Icon({ name, className = "h-5 w-5", ...props }: IconProps) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    ...props
  };

  switch (name) {
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3 2.8 19.1a1.4 1.4 0 0 0 1.2 2.1h16a1.4 1.4 0 0 0 1.2-2.1L12 3Z" />
          <path d="M12 8v5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <path d="M4 21V5.8A1.8 1.8 0 0 1 5.8 4h7.4A1.8 1.8 0 0 1 15 5.8V21" />
          <path d="M15 9h3.2A1.8 1.8 0 0 1 20 10.8V21" />
          <path d="M8 8h3M8 12h3M8 16h3" />
          <path d="M3 21h18" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12.5 4.2 4L19 7" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3.2 1.9" />
        </svg>
      );
    case "drain":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M6 7v4a6 6 0 0 0 12 0V7" />
          <path d="M9 11h6" />
          <path d="M10 15h4" />
          <path d="M12 19v2" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12.5 21c3.2-.4 5.5-2.8 5.5-6 0-2.5-1.6-4.4-3.4-6.3-.8-.9-1.5-2-1.7-3.7-2.6 1.5-4.8 4.5-4 8-1.3-.6-2.2-1.5-2.8-2.6C5.4 11.6 5 13 5 14.4 5 18.2 8.2 21 12.5 21Z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3.5 11 8.5-7 8.5 7" />
          <path d="M5.5 10v10h13V10" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <path d="M4.5 6.5h15v11h-15z" />
          <path d="m5 7 7 6 7-6" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M6.6 4.8 9 4.2l2.1 4.6-1.4 1.1a11 11 0 0 0 4.4 4.4l1.1-1.4 4.6 2.1-.6 2.4c-.3 1.1-1.3 1.8-2.4 1.7C10.1 18.6 5.4 13.9 4.9 7.2c-.1-1.1.6-2.1 1.7-2.4Z" />
        </svg>
      );
    case "pipe":
      return (
        <svg {...common}>
          <path d="M4 15h7a2 2 0 0 0 2-2V6" />
          <path d="M13 6h7" />
          <path d="M8 15v4" />
          <path d="M5 19h6" />
          <path d="M17 6v4" />
          <path d="M14 10h6" />
        </svg>
      );
    case "roof":
      return (
        <svg {...common}>
          <path d="M3 12 12 5l9 7" />
          <path d="M6 12v7h12v-7" />
          <path d="M8 16h8" />
        </svg>
      );
    case "tap":
      return (
        <svg {...common}>
          <path d="M6 7h8a4 4 0 0 1 4 4v2" />
          <path d="M14 7V4h-4v3" />
          <path d="M5 10h4" />
          <path d="M18 13h2" />
          <path d="M19 13v3" />
          <path d="M17 19c0 1.1.9 2 2 2s2-.9 2-2c0-1.7-2-3.2-2-3.2S17 17.3 17 19Z" />
        </svg>
      );
    case "water":
      return (
        <svg {...common}>
          <path d="M12 3.5s6 6.3 6 10.7a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5Z" />
          <path d="M9.2 14.5a3 3 0 0 0 4.6 2.5" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path d="M14.6 6.2a4.4 4.4 0 0 0 5.2 5.2L12 19.2a2.8 2.8 0 0 1-4-4l7.8-7.8Z" />
          <path d="m5 21-2-2" />
        </svg>
      );
  }
}
