export default function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full bg-[#F3E3D6] h-2.5 rounded-full overflow-hidden"
    >
      <div
        className="bg-gradient-to-r from-[#FF7A59] to-[#FFB84D] h-full transition-all duration-500 motion-reduce:transition-none"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
