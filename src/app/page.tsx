import Link from 'next/link';
import { listAvailableSlugs } from '@/lib/contentfulAdapter';
import { RoleSwitcher } from '@/components/studio/RoleSwitcher';

export default async function HomePage() {
  const slugs = await listAvailableSlugs();

  return (
    <main id="main-content" className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold">Page Studio</h1>
      <p className="mt-2 text-muted-foreground">
        Schema-driven landing pages, edited in a Redux-backed studio, published as immutable versioned
        releases.
      </p>

      <section className="mt-8 border border-border rounded-lg p-4" aria-labelledby="role-heading">
        <h2 id="role-heading" className="font-medium mb-2">
          Demo role switcher
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          RBAC is enforced server-side (middleware + API route). Switch roles to see access change.
        </p>
        <RoleSwitcher />
      </section>

      <section className="mt-8" aria-labelledby="pages-heading">
        <h2 id="pages-heading" className="font-medium mb-2">
          Pages
        </h2>
        <ul className="space-y-2">
          {slugs.map((slug) => (
            <li key={slug} className="flex gap-4 items-center">
              <span className="font-mono text-sm">{slug}</span>
              <Link className="underline text-primary" href={`/preview/${slug}`}>
                Preview
              </Link>
              <Link className="underline text-primary" href={`/studio/${slug}`}>
                Edit in studio
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
