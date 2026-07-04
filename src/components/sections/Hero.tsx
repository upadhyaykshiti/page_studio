import { heroPropsSchema } from '@/lib/schema';
import type { z } from 'zod';

type HeroProps = z.infer<typeof heroPropsSchema>;

export function Hero({ props }: { props: unknown }) {
  const parsed = heroPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const { heading, subheading, imageUrl }: HeroProps = parsed.data;
  return (
    <section aria-labelledby="hero-heading" className="py-20 px-6 text-center bg-muted">
      <h1 id="hero-heading" className="text-4xl font-bold tracking-tight sm:text-5xl">
        {heading}
      </h1>
      {subheading ? <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{subheading}</p> : null}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="mt-8 mx-auto rounded-lg max-h-96 object-cover" />
      ) : null}
    </section>
  );
}
