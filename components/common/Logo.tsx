'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  href = '/'
}: LogoProps) {
  // Balanced sizes: larger for clear legibility without overflowing any navbar or card
  const sizeClasses = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-2xl',
    xl: 'w-28 h-28 rounded-3xl'
  }[size];

  const content = (
    <div className={`inline-flex items-center select-none group ${className}`}>
      {/* Official MENUS Logo Standalone (Enlarged for sharp legibility) */}
      <div className={`${sizeClasses} overflow-hidden shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0 border border-orange-200/60 bg-orange-500`}>
        <img 
          src="/logo.png" 
          alt="MENUS Logo" 
          className="w-full h-full object-cover" 
        />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-flex items-center">{content}</Link>;
  }

  return content;
}
