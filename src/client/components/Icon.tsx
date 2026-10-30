import React from 'react';

/** Small inline line-icon set (24px grid, 1.75 stroke) used instead of emoji. */

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h1',
  alert: 'M12 3 2 20h20L12 3zM12 10v4M12 17.5v.01',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3zM9 12l2 2 4-4',
  speaker: 'M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  stop: 'M7 7h10v10H7z',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5L3 12a1.5 1.5 0 0 1 2.6-1.4L8 13',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  hourglass: 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9',
  scale: 'M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  printer:
    'M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  siren: 'M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5zM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pencil: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  hardhat: 'M3 18h18M4 18v-2a8 8 0 0 1 16 0v2M10 8V5h4v3M8.5 9.5 10 8M15.5 9.5 14 8',
  building: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01',
  torch: 'M9 3h6l-1 6h-4L9 3zM10 9h4v12h-4zM12 13v2',
  crane: 'M5 21V5l6-2v18M3 21h10M11 5h10l-3 4M18 9v5M16.5 14h3v3h-3z',
  scaffold: 'M5 3v18M19 3v18M5 8h14M5 14h14M5 8l14 6M19 8 5 14',
  pin: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  gate: 'M3 21V6M21 21V6M3 6h18M7 6v15M11 6v15M15 6v15M19 6v15',
  basement: 'M3 10 12 4l9 6M5 9v12h14V9M9 21v-5h6v5M9 13h6',
  bed: 'M3 18V7M3 12h18v6M21 18v-3M7 12V9h5v3',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM19 19v2H6',
  cup: 'M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
  camera:
    'M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  check: 'M5 12.5 10 17 19 7',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chat: 'M4 5h16v11H9l-5 4V5z',
  users:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4z',
  plus: 'M12 5v14M5 12h14',
  chev: 'm9 6 6 6-6 6',
  back: 'm15 6-6 6 6 6',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  close: 'M6 6l12 12M18 6 6 18',
  share: 'M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, title }) => (
  <svg
    className={className ? `icon ${className}` : 'icon'}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    focusable="false"
  >
    <path d={PATHS[name]} />
  </svg>
);

/** Picks an icon for a workplace zone from its name or id. */
export function zoneIcon(zoneKey: string): IconName {
  const k = zoneKey.toLowerCase();
  if (k.includes('scaffold')) return 'scaffold';
  if (k.includes('crane')) return 'crane';
  if (k.includes('basement')) return 'basement';
  if (k.includes('gate')) return 'gate';
  if (k.includes('hostel')) return 'bed';
  if (k.includes('academic')) return 'book';
  if (k.includes('cafeteria') || k.includes('kitchen')) return 'cup';
  if (k.includes('lab')) return 'flask';
  return 'pin';
}

export default Icon;
