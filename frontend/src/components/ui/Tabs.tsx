'use client';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A59] ${
            value === item.id ? 'bg-[#FF7A59] text-white' : 'bg-white text-[#83726A] border border-[#F3E3D6] hover:bg-[#FFE8DC]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
