import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";

const AUTH_KEY = "isLoggedIn";
const TASK_COLOR_OPTIONS = [
  "#168ab7",
  "#2f9e44",
  "#f08c00",
  "#9c36b5",
  "#c92a2a",
  "#0b7285",
  "#5f3dc4",
  "#495057"
];
const DEFAULT_TASK_COLOR = TASK_COLOR_OPTIONS[0];

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

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeRange(startDate, endDate) {
  const start = startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const end = endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${start} - ${end}`;
}

function toLocalDateTimeInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function buildDefaultTasks() {
  const today = formatLocalDate(new Date());
  return [
    {
      id: "1",
      title: "Project planning session",
      start: `${today}T09:00:00`,
      end: `${today}T10:30:00`,
      date: today,
      timeLabel: "9:00 AM - 10:30 AM",
      color: DEFAULT_TASK_COLOR,
      completed: false,
      editable: true,
      durationEditable: true
    },
    { id: "2", title: "Pay rent", date: "2026-03-01", color: DEFAULT_TASK_COLOR, completed: false, editable: true, durationEditable: false },
    { id: "3", title: "Review monthly budget", date: "2026-03-05", color: DEFAULT_TASK_COLOR, completed: false, editable: true, durationEditable: false },
    { id: "4", title: "Grocery shopping", date: "2026-03-08", color: DEFAULT_TASK_COLOR, completed: false, editable: true, durationEditable: false },
    { id: "5", title: "Cancel unused subscription", date: "2026-03-14", color: DEFAULT_TASK_COLOR, completed: false, editable: true, durationEditable: false },
    { id: "6", title: "Transfer to savings", date: "2026-03-21", color: DEFAULT_TASK_COLOR, completed: false, editable: true, durationEditable: false },
    { id: "c1", title: "Morning workout", date: today, color: DEFAULT_TASK_COLOR, completed: true, editable: true, durationEditable: false },
    { id: "c2", title: "Check emails", date: today, color: DEFAULT_TASK_COLOR, completed: true, editable: true, durationEditable: false }
  ];
}

function TaskBuilderPage() {
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef(null);
  const calendarScrollAreaRef = useRef(null);
  const hasAppliedInitialScrollRef = useRef(false);
  const [tasks, setTasks] = useState(() => buildDefaultTasks());
  const [newTaskDraft, setNewTaskDraft] = useState(null);
  const [editTaskDraft, setEditTaskDraft] = useState(null);
  const [clockTick, setClockTick] = useState(Date.now());

  const userEmail = useMemo(() => {
    try {
      return localStorage.getItem("userEmail") ?? "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!userEmail) return;
      try {
        const res = await fetch(`/api/tasks?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTasks(
            data.map((task) => ({
              ...task,
              completed: Boolean(task.completed),
              color: typeof task.color === "string" && task.color ? task.color : DEFAULT_TASK_COLOR,
              editable: task.editable !== false,
              durationEditable: Boolean(task.durationEditable)
            }))
          );
        }
      } catch {
        // keep local defaults when backend unavailable
      }
    }
    loadTasks();
  }, [userEmail]);

  useEffect(() => {
    const id = setInterval(() => setClockTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  async function persistTasks(nextTasks) {
    if (!userEmail) return;
    try {
      await fetch(`/api/tasks?email=${encodeURIComponent(userEmail)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextTasks)
      });
    } catch {
      // best-effort persistence
    }
  }

  function updateTasksAndPersist(transform) {
    setTasks((prev) => {
      const nextTasks = transform(prev);
      void persistTasks(nextTasks);
      return nextTasks;
    });
  }

  const { calendarEventInputs, overdueTasks, todayTasks, completedTasks } = useMemo(() => {
    const now = new Date(clockTick);
    const today = formatLocalDate(now);
    const overdueList = tasks.filter((task) => {
      if (task.completed) return false;
      if (task.end) {
        const endDate = new Date(task.end);
        return !Number.isNaN(endDate.getTime()) && endDate < now;
      }
      return typeof task.date === "string" && task.date < today;
    });
    const overdueIds = new Set(overdueList.map((task) => task.id));
    return {
      calendarEventInputs: tasks.map((task) => ({
        ...task,
        backgroundColor: task.color || DEFAULT_TASK_COLOR,
        borderColor: task.color || DEFAULT_TASK_COLOR
      })),
      overdueTasks: overdueList,
      todayTasks: tasks.filter((task) => !task.completed && task.date === today && !overdueIds.has(task.id)),
      completedTasks: tasks.filter((task) => task.completed && task.date === today)
    };
  }, [tasks, clockTick]);

  function handleViewChange(viewName) {
    setCalendarView(viewName);
    hasAppliedInitialScrollRef.current = false;
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(viewName);
    }
  }

  function scrollCalendarToOnePm(viewType, attempt = 0) {
    if (viewType !== "timeGridDay" && viewType !== "timeGridWeek") return;
    const scrollArea = calendarScrollAreaRef.current;
    if (!scrollArea) return;

    // Wait for FullCalendar to paint the current view slots.
    requestAnimationFrame(() => {
      const targetSlot = scrollArea.querySelector('.fc-timegrid-slot[data-time="16:00:00"]');
      if (!(targetSlot instanceof HTMLElement)) {
        if (attempt < 6) {
          setTimeout(() => scrollCalendarToOnePm(viewType, attempt + 1), 40);
        }
        return;
      }
      const desiredTop = targetSlot.offsetTop - scrollArea.clientHeight / 2;
      scrollArea.scrollTop = Math.max(0, desiredTop);
      hasAppliedInitialScrollRef.current = true;
    });
  }

  function syncTaskFromCalendarEvent(eventApi) {
    const startDate = eventApi.start;
    if (!startDate) return;
    const endDate = eventApi.end ?? new Date(startDate.getTime() + 60 * 60 * 1000);
    const isTimed = !eventApi.allDay;
    const nextDate = formatLocalDate(startDate);

    updateTasksAndPersist((prev) =>
      prev.map((task) => {
        if (task.id !== eventApi.id) return task;
        if (!isTimed) {
          return {
            ...task,
            date: nextDate,
            start: undefined,
            end: undefined,
            timeLabel: undefined,
            durationEditable: false
          };
        }
        return {
          ...task,
          date: nextDate,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timeLabel: formatTimeRange(startDate, endDate),
          durationEditable: true
        };
      })
    );
  }

  function handleEventDrop(info) {
    syncTaskFromCalendarEvent(info.event);
  }

  function handleEventResize(info) {
    syncTaskFromCalendarEvent(info.event);
  }

  function handleDateClick(info) {
    const clickDate = info.date;
    const isTimedClick = !info.allDay && calendarView !== "dayGridMonth";
    const start = isTimedClick ? new Date(clickDate) : new Date(`${info.dateStr}T09:00:00`);
    openNewTaskPopup(start, !isTimedClick);
  }

  function openNewTaskPopup(startDate, isAllDay) {
    const end = new Date(startDate.getTime() + 60 * 60 * 1000);
    setNewTaskDraft({
      title: "",
      isAllDay,
      color: DEFAULT_TASK_COLOR,
      startInput: toLocalDateTimeInputValue(startDate),
      endInput: toLocalDateTimeInputValue(end)
    });
  }

  function handleAddTaskButtonClick() {
    const now = new Date();
    const rounded = new Date(now);
    rounded.setMinutes(0, 0, 0);
    rounded.setHours(rounded.getHours() + 1);
    const isAllDayDefault = calendarView === "dayGridMonth";
    openNewTaskPopup(rounded, isAllDayDefault);
  }

  function closeNewTaskPopup() {
    setNewTaskDraft(null);
  }

  function handleNewTaskFieldChange(field, value) {
    setNewTaskDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function handleCreateTask(e) {
    e.preventDefault();
    if (!newTaskDraft) return;

    const title = newTaskDraft.title.trim();
    const startDate = new Date(newTaskDraft.startInput);
    const endDate = new Date(newTaskDraft.endInput);
    const isAllDay = Boolean(newTaskDraft.isAllDay);
    if (!title || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || (!isAllDay && endDate <= startDate)) {
      return;
    }

    const nextTask = {
      id: crypto.randomUUID(),
      title,
      date: formatLocalDate(startDate),
      start: isAllDay ? undefined : startDate.toISOString(),
      end: isAllDay ? undefined : endDate.toISOString(),
      timeLabel: isAllDay ? undefined : formatTimeRange(startDate, endDate),
      color: newTaskDraft.color || DEFAULT_TASK_COLOR,
      completed: false,
      editable: true,
      durationEditable: !isAllDay
    };

    updateTasksAndPersist((prev) => [...prev, nextTask]);
    closeNewTaskPopup();
  }

  function handleEventClick(info) {
    setEditTaskDraft({
      id: info.event.id,
      title: info.event.title ?? "",
      color: info.event.extendedProps.color || DEFAULT_TASK_COLOR
    });
  }

  function closeEditTaskPopup() {
    setEditTaskDraft(null);
  }

  function handleEditTaskTitleChange(value) {
    setEditTaskDraft((prev) => (prev ? { ...prev, title: value } : prev));
  }

  function handleEditTaskColorChange(value) {
    setEditTaskDraft((prev) => (prev ? { ...prev, color: value } : prev));
  }

  function handleSaveTaskTitle(e) {
    e.preventDefault();
    if (!editTaskDraft) return;
    const nextTitle = editTaskDraft.title.trim();
    if (!nextTitle) return;
    updateTasksAndPersist((prev) =>
      prev.map((task) =>
        task.id === editTaskDraft.id
          ? { ...task, title: nextTitle, color: editTaskDraft.color || DEFAULT_TASK_COLOR }
          : task
      )
    );
    closeEditTaskPopup();
  }

  function handleDeleteTask() {
    if (!editTaskDraft) return;
    updateTasksAndPersist((prev) => prev.filter((task) => task.id !== editTaskDraft.id));
    closeEditTaskPopup();
  }

  function handleMarkTaskComplete(taskId) {
    updateTasksAndPersist((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: true, date: formatLocalDate(new Date()) } : task))
    );
  }

  function handleMarkTaskIncomplete(taskId) {
    updateTasksAndPersist((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: false } : task)));
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
            <div className="calendar-top-row">
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
              <button
                type="button"
                className="calendar-add-button"
                onClick={handleAddTaskButtonClick}
                aria-label="Add task"
                title="Add task"
              >
                +
              </button>
            </div>
            <div className="calendar-scroll-area" ref={calendarScrollAreaRef}>
              <div className="calendar-scroll-content">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={calendarView}
                  fixedWeekCount={false}
                  stickyHeaderDates
                  height="auto"
                  events={calendarEventInputs}
                  editable
                  eventStartEditable
                  eventDurationEditable
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  nowIndicator
                  eventClassNames={(arg) => (arg.event.extendedProps.completed ? ["fc-event-completed"] : [])}
                  datesSet={() => {
                    if (!hasAppliedInitialScrollRef.current) {
                      const viewType = calendarRef.current?.getApi().view.type;
                      scrollCalendarToOnePm(viewType);
                    }
                  }}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: ""
                  }}
                />
              </div>
            </div>
          </section>
          <div className="task-sidebar">
            {overdueTasks.length > 0 ? (
              <aside className="overdue-task-card">
                <h2>Overdue tasks</h2>
                <ul className="overdue-task-list task-list">
                  {overdueTasks.map((task) => (
                    <li key={task.id}>
                      <div className="task-list-row">
                        <span className="overdue-task-title task-title">{task.title}</span>
                        <button
                          type="button"
                          className="complete-task-button"
                          onClick={() => handleMarkTaskComplete(task.id)}
                          aria-label={`Mark ${task.title} complete`}
                          title="Mark complete"
                        >
                          ✓
                        </button>
                      </div>
                      <span className="overdue-task-date task-date">
                        {task.timeLabel ? `${task.date} | ${task.timeLabel}` : task.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
            <aside className="today-task-card">
              <h2>Today&apos;s tasks</h2>
              {todayTasks.length === 0 ? (
                <p className="task-sidebar-empty">Nothing due today.</p>
              ) : (
                <ul className="today-task-list task-list">
                  {todayTasks.map((task) => (
                    <li key={task.id}>
                      <div className="task-list-row">
                        <span className="today-task-title task-title">{task.title}</span>
                        <button
                          type="button"
                          className="complete-task-button"
                          onClick={() => handleMarkTaskComplete(task.id)}
                          aria-label={`Mark ${task.title} complete`}
                          title="Mark complete"
                        >
                          ✓
                        </button>
                      </div>
                      <span className="today-task-date task-date">
                        {task.timeLabel ? `${task.date} | ${task.timeLabel}` : task.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
            <aside className="completed-task-card">
              <h2>Completed tasks</h2>
              <ul className="completed-task-list task-list">
                {completedTasks.map((task) => (
                  <li key={task.id}>
                    <div className="task-list-row">
                      <span className="completed-task-title task-title">{task.title}</span>
                      <button
                        type="button"
                        className="complete-task-button undo"
                        onClick={() => handleMarkTaskIncomplete(task.id)}
                        aria-label={`Mark ${task.title} incomplete`}
                        title="Undo complete"
                      >
                        ↺
                      </button>
                    </div>
                    <span className="completed-task-date task-date">{task.date}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </main>
      {newTaskDraft ? (
        <div className="task-modal-overlay" role="presentation" onClick={closeNewTaskPopup}>
          <div className="task-modal" role="dialog" aria-modal="true" aria-label="Add new task" onClick={(e) => e.stopPropagation()}>
            <h3>Add task</h3>
            <form className="task-modal-form" onSubmit={handleCreateTask}>
              <label>
                Title
                <input
                  type="text"
                  value={newTaskDraft.title}
                  onChange={(e) => handleNewTaskFieldChange("title", e.target.value)}
                  placeholder="Task title"
                  required
                />
              </label>
              <label className="task-modal-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(newTaskDraft.isAllDay)}
                  onChange={(e) => handleNewTaskFieldChange("isAllDay", e.target.checked)}
                />
                All-day task
              </label>
              <div className="task-color-picker">
                <span>Color</span>
                <div className="task-color-options">
                  {TASK_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`task-color-option ${newTaskDraft.color === color ? "is-active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleNewTaskFieldChange("color", color)}
                      aria-label={`Set task color ${color}`}
                    />
                  ))}
                </div>
              </div>
              <label>
                Start
                <input
                  type="datetime-local"
                  value={newTaskDraft.startInput}
                  onChange={(e) => handleNewTaskFieldChange("startInput", e.target.value)}
                  required
                />
              </label>
              <label>
                End
                <input
                  type="datetime-local"
                  value={newTaskDraft.endInput}
                  onChange={(e) => handleNewTaskFieldChange("endInput", e.target.value)}
                  required={!newTaskDraft.isAllDay}
                  disabled={Boolean(newTaskDraft.isAllDay)}
                />
              </label>
              <div className="task-modal-actions">
                <button type="button" className="view-button" onClick={closeNewTaskPopup}>
                  Cancel
                </button>
                <button type="submit" className="view-button is-active">
                  Save task
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {editTaskDraft ? (
        <div className="task-modal-overlay" role="presentation" onClick={closeEditTaskPopup}>
          <div className="task-modal" role="dialog" aria-modal="true" aria-label="Edit task" onClick={(e) => e.stopPropagation()}>
            <h3>Edit task</h3>
            <form className="task-modal-form" onSubmit={handleSaveTaskTitle}>
              <label>
                Task name
                <input
                  type="text"
                  value={editTaskDraft.title}
                  onChange={(e) => handleEditTaskTitleChange(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </label>
              <div className="task-color-picker">
                <span>Color</span>
                <div className="task-color-options">
                  {TASK_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`task-color-option ${editTaskDraft.color === color ? "is-active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleEditTaskColorChange(color)}
                      aria-label={`Set task color ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="task-modal-actions split">
                <button type="button" className="delete-task-button" onClick={handleDeleteTask}>
                  Delete
                </button>
                <div className="task-modal-actions">
                  <button type="button" className="view-button" onClick={closeEditTaskPopup}>
                    Cancel
                  </button>
                  <button type="submit" className="view-button is-active">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
