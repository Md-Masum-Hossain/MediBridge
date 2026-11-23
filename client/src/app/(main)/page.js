export default function HomePage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primaryText tracking-tight">
          MediBridge
        </h1>
        <p className="text-sm text-secondaryText mt-1">
          Clinical Prescription Digitization & Smart Alarms
        </p>
      </header>

      <section className="bg-surface rounded-xl p-5 border border-divider">
        <h2 className="text-base font-semibold text-primaryText mb-2">
          Project Initialized
        </h2>
        <p className="text-sm text-secondaryText leading-relaxed">
          The 4 MongoDB Mongoose models (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">User</code>,{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">Prescription</code>,{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">MedicineMaster</code>,{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">Pharmacy</code>) and Kaggle medicine seed script are ready for your review.
        </p>
      </section>
    </main>
  );
}
