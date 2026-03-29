import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Login from "./Login.jsx";

const AUTH_KEY = "isLoggedIn";

function getIsLoggedIn() {
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  if (!getIsLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

function TaskBuilderPage() {
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

  const navigate = useNavigate();
  function handleLogout() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-row">
          <h1>Task Builder</h1>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            getIsLoggedIn() ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TaskBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
