export default function ErrorPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="text-2xl font-semibold">We couldn’t open this page.</h1>
        <p className="muted">
          Please reload and try again. If the problem continues, contact
          Pixelerion.
        </p>
        <a className="text-button" href="/">
          Return to Pixelerion
        </a>
      </div>
    </main>
  );
}
