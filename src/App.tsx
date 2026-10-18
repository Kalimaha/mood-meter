import { useCallback, useState } from 'react'
import { EventForm } from './components/events'
import { TimelineWithEvents } from './components/timeline'
import { DayEntryPanel } from './components/rating/DayEntryPanel'
import { todayIso } from './domain/dates'
import type { CreateTimelineEventInput } from './domain/events'
import type { TimelineEvent } from './domain/types'
import { loadDayEntries } from './storage/days'
import { addEvent, loadEvents } from './storage/events'
import { ensureDemoSeed } from './storage/seed'
import { dayEntriesToTimelineDays } from './storage/timelineDays'
import type { TimelineDay } from './components/timeline'

function App() {
  const [days, setDays] = useState<TimelineDay[]>(() => {
    ensureDemoSeed()
    return dayEntriesToTimelineDays(loadDayEntries())
  })
  const [events, setEvents] = useState<TimelineEvent[]>(() => loadEvents())
  const [selectedDate, setSelectedDate] = useState(todayIso)

  const refreshDays = useCallback(() => {
    setDays(dayEntriesToTimelineDays(loadDayEntries()))
  }, [])

  const handleCreateEvent = useCallback((input: CreateTimelineEventInput) => {
    setEvents(addEvent(input))
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

        <EventForm
          onSubmit={handleCreateEvent}
          defaultStartDate={selectedDate}
        />
      </main>
    </div>
  )
}

export default App
