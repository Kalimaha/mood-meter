import { useCallback, useState } from 'react'
import { TimelineWithEvents } from './components/timeline'
import { DayEntryPanel } from './components/rating/DayEntryPanel'
import { todayIso } from './domain/dates'
import type { TimelineEvent } from './domain/types'
import { loadDayEntries } from './storage/days'
import { loadEvents } from './storage/events'
import { ensureDemoSeed } from './storage/seed'
import { dayEntriesToTimelineDays } from './storage/timelineDays'
import type { TimelineDay } from './components/timeline'

function App() {
  const [days, setDays] = useState<TimelineDay[]>(() => {
    ensureDemoSeed()
    return dayEntriesToTimelineDays(loadDayEntries())
  })
  const [events] = useState<TimelineEvent[]>(() => loadEvents())
  const [selectedDate, setSelectedDate] = useState(todayIso)

  const refreshDays = useCallback(() => {
    setDays(dayEntriesToTimelineDays(loadDayEntries()))
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Mood Meter</h1>
      </header>
      <main className="app-main">
        <TimelineWithEvents days={days} events={events} />

        <DayEntryPanel
          date={selectedDate}
          onDateChange={setSelectedDate}
          onChange={refreshDays}
        />

        <p className="app-lede">
          A minimal daily mood journal. Rate each day, optionally note why, and
          watch the path over time.
        </p>
      </main>
    </div>
  )
}

export default App
