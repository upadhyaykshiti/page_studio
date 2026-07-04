import { featureGridPropsSchema } from '@/lib/schema';
import type { z } from 'zod';

type FeatureGridProps = z.infer<typeof featureGridPropsSchema>;

export function FeatureGrid({ props }: { props: unknown }) {
  const parsed = featureGridPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const { heading, features }: FeatureGridProps = parsed.data;
  return (
    <section aria-labelledby="features-heading" className="py-16 px-6">
      {heading ? (
        <h2 id="features-heading" className="text-3xl font-semibold text-center mb-10">
          {heading}
        </h2>
      ) : null}
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto list-none">
        {features.map((f, i) => (
          <li key={i} className="border border-border rounded-lg p-6">
            <h3 className="font-medium text-lg">{f.title}</h3>
            {f.description ? <p className="mt-2 text-sm text-muted-foreground">{f.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
