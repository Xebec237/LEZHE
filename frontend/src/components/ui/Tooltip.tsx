'use client';

import { useId } from 'react';

/** Info-bulle accessible : visible au survol ET au focus clavier. */
export default function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <span className="relative inline-flex group">
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#2E241F] px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 z-20"
      >
        {label}
      </span>
    </span>
  );
}
