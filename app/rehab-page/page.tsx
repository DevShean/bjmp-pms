export default function RehabPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="rounded-2xl border border-(--line) bg-(--surface) p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.2em] text-(--primary-accent) uppercase">
          BJMP Internal Portal
        </p>
        <h1 className="mt-2 font-lexend text-3xl font-bold text-(--primary)">Rehab Page</h1>
        <p className="mt-2 text-sm text-[#5f6f8f]">
          You are signed in as rehabilitation staff. This is a placeholder page while
          authentication and database features are still being built.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-(--line) bg-(--surface-strong) p-6">
        <h2 className="font-lexend text-xl font-semibold text-(--primary)">Next Steps</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#5f6f8f]">
          <li>Connect rehabilitation staff sign-in to backend authentication.</li>
          <li>Load intervention programs and progress plans from your database.</li>
          <li>Add protected routes with rehabilitation-role permissions.</li>
        </ul>
      </section>
    </main>
  );
}
