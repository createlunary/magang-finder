export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-primary"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.53} height={size * 0.53} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7" stroke="#17170F" strokeWidth="1.8" />
        <circle cx="18.5" cy="8.5" r="1.8" fill="#17170F" />
      </svg>
    </div>
  );
}
