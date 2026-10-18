/**
 * Minimal Phase 1 placeholder shell — not the full mood UI.
 */
export function HomeShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Mood Meter</h1>
      </header>
      <main className="app-main">
        <p className="app-lede">
          A minimal daily mood journal. Rate each day, optionally note why, and
          watch the path over time.
        </p>
        <p className="app-meta">Phase 1 scaffold — core UI comes next.</p>
      </main>
    </div>
  )
}
