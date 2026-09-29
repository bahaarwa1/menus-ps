import React from 'react';

interface CategoryIconProps {
  id: string;
  className?: string;
}

export default function CategoryIcon({ id, className = "w-4 h-4" }: CategoryIconProps) {
  switch (id) {
    case 'all':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      );
    case 'breakfast':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/>
        </svg>
      );
    case 'fryers':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13h13a4 4 0 0 1 4 4H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2Z"/>
          <path d="M18 15l4-3"/>
          <path d="M7 9c0-1.5 1-2 1-3"/><path d="M11 8c0-1.5 1-2 1-3"/>
        </svg>
      );
    case 'manakeesh':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="9" ry="6"/>
          <circle cx="8" cy="12" r="0.75" fill="currentColor"/>
          <circle cx="12" cy="11" r="0.75" fill="currentColor"/>
          <circle cx="16" cy="12.5" r="0.75" fill="currentColor"/>
        </svg>
      );
    case 'pizza':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 2 9 17a11 11 0 0 1-18 0z"/>
          <circle cx="12" cy="11" r="1.5"/>
          <circle cx="10" cy="15" r="1"/>
        </svg>
      );
    case 'salads':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11a9 9 0 0 0 18 0H3z"/>
          <path d="M12 4a4 4 0 0 0-4 4c2 0 4 1 4 3"/>
          <path d="M12 4a4 4 0 0 1 4 4c-2 0-4 1-4 3"/>
        </svg>
      );
    case 'mutabal':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11a9 9 0 0 0 18 0H3z"/>
          <path d="M7 8a5 5 0 0 1 10 0"/>
        </svg>
      );
    case 'soups':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 0 18 0H3z"/>
          <path d="M8 5c0 1.5 1 2 1 3"/>
          <path d="M12 4c0 1.5 1 2 1 3"/>
          <path d="M16 5c0 1.5 1 2 1 3"/>
          <line x1="2" y1="18" x2="22" y2="18"/>
        </svg>
      );
    case 'sandwiches':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="2" rx="0.5"/>
          <path d="M4 7h16a2 2 0 0 1 2 2v2H2V9a2 2 0 0 1 2-2z"/>
          <path d="M2 13h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
        </svg>
      );
    case 'snacks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9l2 12h10l2-12"/>
          <path d="M8 9V4h2v5"/><path d="M11 9V3h2v6"/><path d="M14 9V5h2v4"/>
        </svg>
      );
    case 'international':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18h18a1 1 0 0 0 1-1 9 9 0 0 0-18 0 1 1 0 0 0-1 1z"/>
          <path d="M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          <line x1="2" y1="21" x2="22" y2="21"/>
        </svg>
      );
    case 'beef_steaks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="8" ry="5.5" transform="rotate(-25 12 12)"/>
          <circle cx="11.5" cy="12" r="1.5"/>
        </svg>
      );
    case 'chicken_steaks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15.5 8.5 2-2a3.5 3.5 0 0 1 5 5l-2 2a5 5 0 0 1-7-1l-2-2a5 5 0 0 1 4-2z"/>
          <circle cx="7" cy="17" r="1.5"/><circle cx="5" cy="14" r="1.5"/>
          <path d="m8 15 3.5-3.5"/>
        </svg>
      );
    case 'grills':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c1 3 4 4 4 8a6 6 0 0 1-12 0c0-4 3-5 4-8z"/>
          <path d="M12 13a2 2 0 0 0 2 2"/>
        </svg>
      );
    case 'oriental':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8A9 9 0 0 0 12 3z"/>
          <path d="m16 8 1 2 2 .5-1.5 1.5.5 2-2-1-2 1 .5-2L13 10.5l2-.5z"/>
        </svg>
      );
    case 'seafood':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 16s5-1 8-5c4-5 12-3 12-3s-2 8-7 12c-4 3-5 8-5 8s0-5-3-7-5-5-5-5z"/>
          <circle cx="16" cy="10" r="1"/>
        </svg>
      );
    case 'hot_drinks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
          <line x1="6" y1="2" x2="6" y2="4"/>
          <line x1="10" y1="2" x2="10" y2="4"/>
          <line x1="14" y1="2" x2="14" y2="4"/>
        </svg>
      );
    case 'cold_drinks':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 6h10l-1.5 14h-7L7 6Z"/>
          <path d="m15 2-3 4"/>
          <line x1="5" y1="6" x2="19" y2="6"/>
        </svg>
      );
    case 'fresh_juices':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="m12 12 6.36-6.36M12 12v9M12 12H3M12 12l-6.36-6.36"/>
        </svg>
      );
    case 'fresh_juices_jugs':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h10l1 3v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7l1-3z"/>
          <path d="M17 9h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3"/>
        </svg>
      );
    case 'milkshake':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10h10l-1.5 11h-7L7 10Z"/>
          <path d="M7 10a5 5 0 0 1 10 0"/>
          <line x1="15" y1="2" x2="12" y2="6"/>
        </svg>
      );
    case 'mojito':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 4 7 8v7H8v2h8v-2h-4v-7l7-8H5Z"/>
          <path d="M13 2c2 1 2 3 0 4"/>
        </svg>
      );
    case 'cocktails':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 4 8 8 8-8H4Z"/>
          <path d="M12 12v8"/>
          <path d="M8 20h8"/>
        </svg>
      );
    case 'fruit_plates':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
          <path d="M10 2c1 .5 2 2 2 5"/>
        </svg>
      );
    case 'ice_cream':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 11 5 11 5-11"/>
          <circle cx="12" cy="7" r="4.5"/>
        </svg>
      );
    case 'desserts':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 16 10-6 10 6v4H2v-4z"/>
          <circle cx="12" cy="4" r="1.5"/>
          <line x1="12" y1="5.5" x2="12" y2="10"/>
        </svg>
      );
    case 'shisha':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v5"/>
          <path d="M12 8a3.5 3.5 0 0 0-3.5 3.5v7.5h7V11.5A3.5 3.5 0 0 0 12 8z"/>
          <circle cx="12" cy="3" r="1.5"/>
          <path d="M15.5 13c2.5 0 3.5-1 3.5-3v-1"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2v20M6 2v20"/>
          <circle cx="12" cy="12" r="7"/>
        </svg>
      );
  }
}
