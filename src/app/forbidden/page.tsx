import Link from 'next/link';

export default function ForbiddenPage({
  searchParams,
}: {
  searchParams: { required?: string; from?: string };
}) {
  return (
    <main id="main-content" className="max-w-xl mx-auto py-24 px-6 text-center">
      <h1 className="text-2xl font-bold">Access restricted</h1>
      <p className="mt-4 text-muted-foreground">
        {searchParams.from ? <>You tried to open <code>{searchParams.from}</code>. </> : null}
        This area requires the{' '}
        <strong>{searchParams.required ?? 'editor'}</strong> role or higher.
      </p>
      <Link href="/" className="mt-6 inline-block underline text-primary">
        Back to home
      </Link>
    </main>
  );
}
