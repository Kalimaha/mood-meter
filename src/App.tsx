import { Activity } from 'lucide-react'
import { useCallback, useState } from 'react'
import { EventsPanel } from './components/events'
import { TimelineWithEvents } from './components/timeline'
import { DayEntryPanel } from './components/rating/DayEntryPanel'
import type { TimelineEvent } from './domain/types'
import { loadDayEntries } from './storage/days'
import { loadEvents } from './storage/events'
import { dayEntriesToTimelineDays } from './storage/timelineDays'
import type { TimelineDay } from './components/timeline'

function App() {
  const [days, setDays] = useState<TimelineDay[]>(() =>
    dayEntriesToTimelineDays(loadDayEntries()),
  )
  const [events, setEvents] = useState<TimelineEvent[]>(() => loadEvents())

  const refreshDays = useCallback(() => {
    setDays(dayEntriesToTimelineDays(loadDayEntries()))
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <Activity className="app-logo" aria-hidden="true" />
        <h1 className="app-title">Mood Meter</h1>
      </header>
      <main className="app-main">
        <p className="app-lede">
          A minimal daily mood journal. Rate each day, optionally note why, and
          watch the path over time.
        </p>

        <DayEntryPanel onChange={refreshDays} />

        <section
          className="flex flex-col gap-2"
          aria-labelledby="timeline-heading"
        >
          <h2
            id="timeline-heading"
            className="m-0 text-lg font-semibold tracking-tight"
            style={{ color: 'var(--mm-fg)' }}
          >
            Timeline
          </h2>
          <TimelineWithEvents days={days} events={events} />
        </section>

        <EventsPanel onEventsChange={setEvents} />
      </main>
    </div>
  )
}

export default App
