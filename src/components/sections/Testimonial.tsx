import { testimonialPropsSchema } from '@/lib/schema';
import type { z } from 'zod';

type TestimonialProps = z.infer<typeof testimonialPropsSchema>;

export function Testimonial({ props }: { props: unknown }) {
  const parsed = testimonialPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const { quote, author, role }: TestimonialProps = parsed.data;
  return (
    <section aria-label="Testimonial" className="py-16 px-6 bg-muted">
      <blockquote className="max-w-2xl mx-auto text-center">
        <p className="text-xl italic">&ldquo;{quote}&rdquo;</p>
        <footer className="mt-4 text-sm text-muted-foreground">
          <cite className="not-italic font-medium">{author}</cite>
          {role ? `, ${role}` : null}
        </footer>
      </blockquote>
    </section>
  );
}
