export default function Loader({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-y-4"
    >
      <span className="relative grid h-14 w-14 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-primary-accent" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
      </span>
      <p className="text-sm text-secondary-text">{label}</p>
    </div>
  );
}
