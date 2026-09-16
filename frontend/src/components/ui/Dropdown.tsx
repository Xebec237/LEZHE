'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  label: string;
  onSelect: () => void;
}

export default function Dropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#F3E3D6] bg-[#FFF9F3] text-sm font-semibold text-[#2E241F] hover:bg-[#FFE8DC]"
      >
        {label}
        <ChevronDown size={16} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#F3E3D6] bg-white shadow-card p-1.5 z-20">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#2E241F] hover:bg-[#FFE8DC]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
