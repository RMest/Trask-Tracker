import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);

  const sampleTasks = useMemo(
    () => [
      { id: "1", title: "Pay rent", date: "2026-03-01" },
      { id: "2", title: "Review monthly budget", date: "2026-03-05" },
      { id: "3", title: "Grocery shopping", date: "2026-03-08" },
      { id: "4", title: "Cancel unused subscription", date: "2026-03-14" },
      { id: "5", title: "Transfer to savings", date: "2026-03-21" }
    ],
    []
  );

  function handleDateClick(info) {
    setSelectedDate(info.dateStr);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Task Builder</h1>
      </header>

      <main className="container">
        <p className="subtitle">Visual calendar with sample tasks</p>
        <div className="layout">
          <section className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              fixedWeekCount={false}
              height="auto"
              events={sampleTasks}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: ""
              }}
            />
          </section>
          <aside className="task-card">
            <h2>Sample Tasks</h2>
            {selectedDate ? (
              <p className="selected-date">Selected date: {selectedDate}</p>
            ) : (
              <p className="selected-date">Click a date on the calendar.</p>
            )}
            <ul className="task-list">
              {sampleTasks.map((task) => (
                <li key={task.id}>
                  <span className="task-title">{task.title}</span>
                  <span className="task-date">{task.date}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
