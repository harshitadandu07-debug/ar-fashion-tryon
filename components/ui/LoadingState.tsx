type LoadingStateProps = {
  title?: string;
  subtitle?: string;
};

export function LoadingState({
  title = "Loading…",
  subtitle,
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      <div className="text-base font-medium text-white">{title}</div>
      {subtitle ? (
        <div className="text-sm leading-relaxed text-white/70">{subtitle}</div>
      ) : null}
    </div>
  );
}

