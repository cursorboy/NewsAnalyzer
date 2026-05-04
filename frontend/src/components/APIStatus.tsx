import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAPIStatus, type APIStatus } from '../lib'
import Masthead from './Masthead'
import NeuralLoader from './NeuralLoader'

export default function APIStatusDashboard() {
  const [status, setStatus] = useState<APIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const apiStatus = await getAPIStatus()
      setStatus(apiStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <Masthead />
        <div className="flex min-h-[60vh] items-center justify-center">
          <NeuralLoader label="Polling search-API health" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Masthead />

      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <header className="border-b border-ink/15 pb-8">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
            Section E · Operations
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
            API status
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-lg italic text-ink/70">
            Live health of the Google Custom Search backend powering the wire.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={fetchStatus}
              className="border border-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-paper transition-colors"
            >
              Refresh
            </button>
            <Link
              to="/"
              className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
            >
              ← Back to front page
            </Link>
            <span className="ml-auto font-sans text-[10px] uppercase tracking-[0.18em] text-ink/45">
              Auto-refresh · 30s
            </span>
          </div>
        </header>

        {error && (
          <p className="mt-8 border-l-2 border-accent pl-4 font-serif italic text-ink/75">
            {error}
          </p>
        )}

        {status && (
          <section className="mt-10 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink/15">
            <Cell label="API configured" value={status.api_configured ? 'Yes' : 'No'} accent={!status.api_configured} />
            <Cell label="Total requests" value={String(status.total_requests)} mono />
            <Cell label="Failed requests" value={String(status.failed_requests)} mono accent={status.failed_requests > 0} />
            <Cell
              label="Success rate"
              value={`${status.success_rate.toFixed(1)}%`}
              mono
              accent={status.success_rate < 90}
            />
            <Cell label="Rate limited" value={status.rate_limited ? 'Yes' : 'No'} accent={status.rate_limited} />
            <Cell label="Quota exceeded" value={status.quota_exceeded ? 'Yes' : 'No'} accent={status.quota_exceeded} />
            {status.last_request_time && (
              <Cell
                label="Last request"
                value={new Date(status.last_request_time).toLocaleTimeString()}
                mono
              />
            )}
          </section>
        )}

        {status?.last_error && (
          <section className="mt-10 border border-ink/20 px-6 py-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
              Last error · {status.last_error.type}
            </p>
            <p className="mt-3 font-serif text-base leading-relaxed text-ink/85">
              {status.last_error.message}
            </p>
            {status.last_error.time && (
              <p className="mt-3 font-mono text-[11px] tabular-nums text-ink/55">
                {new Date(status.last_error.time).toLocaleString()}
              </p>
            )}
          </section>
        )}

        <section className="mt-12 border-t border-ink/15 pt-6 flex flex-wrap items-center gap-5">
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            External consoles
          </span>
          <a
            href="https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-accent"
          >
            Google quotas ↗
          </a>
          <a
            href="https://console.cloud.google.com/apis/api/customsearch.googleapis.com/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-accent"
          >
            API metrics ↗
          </a>
        </section>
      </main>
    </div>
  )
}

function Cell({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="border-r border-b border-ink/15 px-5 py-5">
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        {label}
      </p>
      <p
        className={[
          'mt-2 tabular-nums leading-none',
          mono ? 'font-mono text-2xl' : 'font-serif text-3xl',
          accent ? 'text-accent' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}
