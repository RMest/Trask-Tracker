import { useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";

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
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef(null);

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

  function handleViewChange(viewName) {
    setCalendarView(viewName);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(viewName);
    }
  }

  const navigate = useNavigate();
  function handleLogout() {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem("userEmail");
    } catch {
      // ignore
    }
    navigate("/login", { replace: true });
    window.location.assign("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-row">
        <h1 className="app-header-title">
          Task <span className="app-builder-word">Builder</span>
        </h1>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="container">
        <div className="layout">
          <section className="calendar-card">
            <div className="calendar-view-controls">
              <button
                type="button"
                className={`view-button ${calendarView === "timeGridDay" ? "is-active" : ""}`}
                onClick={() => handleViewChange("timeGridDay")}
              >
                Day
              </button>
              <button
                type="button"
                className={`view-button ${calendarView === "timeGridWeek" ? "is-active" : ""}`}
                onClick={() => handleViewChange("timeGridWeek")}
              >
                Week
              </button>
              <button
                type="button"
                className={`view-button ${calendarView === "dayGridMonth" ? "is-active" : ""}`}
                onClick={() => handleViewChange("dayGridMonth")}
              >
                Month
              </button>
            </div>
            <div className="calendar-scroll-area">
              <div className="calendar-scroll-content">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={calendarView}
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
              </div>
            </div>
          </section>
          <aside className="task-card">
            <h2>Todays Tasks</h2>
            
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
          path="/signup"
          element={getIsLoggedIn() ? <Navigate to="/" replace /> : <Signup />}
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
