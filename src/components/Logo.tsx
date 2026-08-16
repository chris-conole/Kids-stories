const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dreamloom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-semibold text-night-900 ${className}`}>
      <span aria-hidden className="text-2xl">🌙</span>
      {APP_NAME}
    </span>
  );
}
