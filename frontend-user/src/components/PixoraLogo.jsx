"use client";

import React from "react";

export default function PixoraLogo({ className = "w-10 h-10", withText = false, size = "md" }) {
  // Size-specific dimensions
  const dims = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16"
  }[size] || className;

  return (
    <div className="flex items-center gap-2.5 select-none select-none">
      {/* Visual Aperture / Helix gradient camera lens vector */}
      <svg className={dims} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pixora-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff007f" />
            <stop offset="50%" stopColor="#7928ca" />
            <stop offset="100%" stopColor="#0070f3" />
          </linearGradient>
          <linearGradient id="pixora-accent" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#f9cb28" />
          </linearGradient>
          <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle cx="50" cy="50" r="44" stroke="url(#pixora-grad)" strokeWidth="6" opacity="0.85" />
        
        {/* Glowing visual iris shutter blades */}
        <path d="M50 12 C60 25, 75 35, 72 50 C68 65, 52 72, 38 65 C25 58, 25 38, 38 25 Z" fill="url(#pixora-grad)" opacity="0.9" />
        <path d="M50 18 C58 28, 68 34, 66 45 C63 56, 51 61, 41 56 C32 51, 32 37, 41 28 Z" fill="url(#pixora-accent)" opacity="0.75" />

        {/* Shutter core point */}
        <circle cx="50" cy="50" r="8" fill="#ffffff" filter="url(#glow)" />
      </svg>
      
      {withText && (
        <span className="font-display font-black tracking-tight text-white uppercase text-base sm:text-lg bg-gradient-to-r from-white via-zinc-150 to-zinc-300 bg-clip-text text-transparent">
          Pixora
        </span>
      )}
    </div>
  );
}
