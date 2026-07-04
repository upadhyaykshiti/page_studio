import { ctaPropsSchema } from '@/lib/schema';
import type { z } from 'zod';

type CtaProps = z.infer<typeof ctaPropsSchema>;

export function Cta({ props }: { props: unknown }) {
  const parsed = ctaPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const { label, url, style }: CtaProps = parsed.data;
  const base =
    'inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors';
  const variant =
    style === 'secondary'
      ? 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10'
      : 'bg-primary text-primary-foreground hover:opacity-90';
  return (
    <section aria-label="Call to action" className="py-16 px-6 text-center">
      <a href={url} className={`${base} ${variant}`} data-testid="cta-link">
        {label}
      </a>
    </section>
  );
}
