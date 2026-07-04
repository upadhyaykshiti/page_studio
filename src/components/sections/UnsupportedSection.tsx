export function UnsupportedSection({ type, reason }: { type: string; reason?: string }) {
  return (
    <section
      role="note"
      aria-label="Unsupported section"
      className="mx-6 my-4 rounded-md border-2 border-dashed border-destructive/60 bg-destructive/5 p-6 text-sm"
    >
      <p className="font-medium text-destructive">Unsupported section: &ldquo;{type}&rdquo;</p>
      {reason ? <p className="mt-1 text-muted-foreground">{reason}</p> : null}
    </section>
  );
}
