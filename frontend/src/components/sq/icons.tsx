import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Stroke = ({ children, size, className = "ic", ...rest }: IconProps & { children: ReactNode }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <Stroke {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Stroke>
);
export const IconClock = (p: IconProps) => (
  <Stroke {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Stroke>
);
export const IconPlane = (p: IconProps) => (
  <Stroke {...p}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></Stroke>
);
export const IconHotel = (p: IconProps) => (
  <Stroke {...p}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4" /></Stroke>
);
export const IconCheck = (p: IconProps) => (
  <Stroke {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Stroke>
);
export const IconX = (p: IconProps) => (
  <Stroke {...p}><path d="M6 6l12 12M18 6L6 18" /></Stroke>
);
export const IconPin = (p: IconProps) => (
  <Stroke {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Stroke>
);
export const IconWalk = (p: IconProps) => (
  <Stroke {...p}><circle cx="13" cy="4" r="2" /><path d="M10 21l2-6 3 3v3M8 11l3-3 3 1 2 3M11 8l-1 6" /></Stroke>
);
export const IconUsers = (p: IconProps) => (
  <Stroke {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2" /></Stroke>
);
export const IconDoc = (p: IconProps) => (
  <Stroke {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></Stroke>
);
export const IconShield = (p: IconProps) => (
  <Stroke {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></Stroke>
);
export const IconSearch = (p: IconProps) => (
  <Stroke {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Stroke>
);
export const IconPrint = (p: IconProps) => (
  <Stroke {...p}><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3" /><rect x="7" y="14" width="10" height="7" /></Stroke>
);
export const IconShare = (p: IconProps) => (
  <Stroke {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></Stroke>
);
export const IconPlay = (p: IconProps) => (
  <Stroke {...p}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5.5 3.5-5.5 3.5z" /></Stroke>
);
export const IconHeart = (p: IconProps) => (
  <Stroke {...p}><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" /><path d="M12 9v5M9.5 11.5h5" /></Stroke>
);
export const IconBook = (p: IconProps) => (
  <Stroke {...p}><path d="M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M8 7h6M8 11h4" /></Stroke>
);
export const IconCard = (p: IconProps) => (
  <Stroke {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></Stroke>
);
export const IconReceipt = (p: IconProps) => (
  <Stroke {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></Stroke>
);
export const IconTrain = (p: IconProps) => (
  <Stroke {...p}><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M8 21l2-4M16 21l-2-4" /></Stroke>
);
export const IconTicket = (p: IconProps) => (
  <Stroke {...p}><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z" /><path d="M14 5v14" /></Stroke>
);
export const IconSun = (p: IconProps) => (
  <Stroke {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Stroke>
);
export const IconMoon = (p: IconProps) => (
  <Stroke {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Stroke>
);
export const IconPulse = (p: IconProps) => (
  <Stroke {...p}><path d="M3 12h4l2-5 4 10 2-5h6" /></Stroke>
);
export const IconElder = (p: IconProps) => (
  <Stroke {...p}><circle cx="11" cy="4" r="2" /><path d="M9 21l1.5-7L8 12V8l4-1 3 3M15 13l3 8M18 9v12" /></Stroke>
);
export const IconSteth = (p: IconProps) => (
  <Stroke {...p}><path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2" /><circle cx="18" cy="12" r="2" /></Stroke>
);
export const IconPhone = (p: IconProps) => (
  <Stroke {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></Stroke>
);
export const IconMail = (p: IconProps) => (
  <Stroke {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Stroke>
);
export const IconPassport = (p: IconProps) => (
  <Stroke {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></Stroke>
);
export const IconSyringe = (p: IconProps) => (
  <Stroke {...p}><path d="M18 2l4 4M17 7l3-3M5 15l-3 3 4 4 3-3M8 12l4 4M10 10l4 4M14 6l4 4-8 8-4-4z" /></Stroke>
);
export const IconChevron = ({ dir = "left", ...p }: IconProps & { dir?: "left" | "right" }) => (
  <Stroke {...p}><path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} /></Stroke>
);
export const IconMenu = (p: IconProps) => (
  <Stroke {...p} strokeWidth={1.8}><path d="M4 7h16M4 12h16M4 17h16" /></Stroke>
);
export const IconPlus = (p: IconProps) => (
  <Stroke {...p} strokeWidth={2}><path d="M12 5v14M5 12h14" /></Stroke>
);
export const IconCamera = (p: IconProps) => (
  <Stroke {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Stroke>
);
export const IconStar = ({ className = "ic", ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </svg>
);
export const IconWa = ({ className = "ic", ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
  </svg>
);

export const Stars = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="stars" aria-label={`Bintang ${count}`}>
      {Array.from({ length: Math.min(count, 5) }, (_, i) => (
        <IconStar key={i} />
      ))}
    </span>
  ) : null;
