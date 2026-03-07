import { useState } from "react";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskDetailModal from "./TaskDetailModal";

const COLUMNS = ["todo", "in_progress", "blocked", "review", "done"];

const COLUMN_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
};

const COLUMN_COLORS = {
  todo: "border-neutral-500",
  in_progress: "border-blue-300 ",
  blocked: "border-red-300 ",
  review: "border-yellow-300 ",
  done: "border-green-300",
};

const COLUMN_HEADER_COLORS = {
  todo: "text-neutral-500",
  in_progress: "text-blue-500",
  blocked: "text-red-500",
  review: "text-yellow-500",
  done: "text-green-500",
};

function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-neutral-700 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm font-bold text-black dark:text-white mb-2">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        {task.due_date && (
          <span className="text-xs text-neutral-400">
            Due Date: {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        {task.assignee && (
          <img
            src={
              task.assignee.image ||
              `https://ui-avatars.com/api/?name=${task.assignee}&background=0D8ABC&color=fff`
            }
            className="w-6 h-6 rounded-full"
            title={task.assignee.name}
          />
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, onTaskClick }) {
  // FIX: useDroppable MUST be inside the component that acts as the drop target
  const { setNodeRef } = useDroppable({
    id: column,
  });

  return (
    <div
      ref={setNodeRef} // This tells dnd-kit this div is a drop zone
      className={`rounded-2xl border-2 ${COLUMN_COLORS[column]} p-4 min-h-125 bg-neutral-50/50 dark:bg-neutral-900/20 transition-colors`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-xs font-black uppercase tracking-widest ${COLUMN_HEADER_COLORS[column]}`}
        >
          {COLUMN_LABELS[column]}
        </h3>
        <span className="text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 px-2 py-0.5 rounded-full shadow-sm">
          {tasks.length}
        </span>
      </div>

      {/* Cards Area */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {/* Visual cue if column is empty */}
          {tasks.length === 0 && (
            <div className="h-24 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 text-xs">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTasksChange, projectId }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevents accidental drags when clicking
      },
    }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Logic to find if we dropped over a task or a column
    const draggedTask = tasks.find((t) => t.id === activeId);

    // If dropped on a column, overId is the column name (e.g., 'todo')
    // If dropped on a task, overId is the task ID.
    // We need to determine the target status.
    let newStatus = overId;
    if (!COLUMNS.includes(overId)) {
      const targetTask = tasks.find((t) => t.id === overId);
      newStatus = targetTask ? targetTask.status : draggedTask.status;
    }

    if (!draggedTask || draggedTask.status === newStatus) return;

    const originalTasks = [...tasks];

    // Optimistically update UI
    onTasksChange(
      tasks.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t)),
    );

    try {
      const tagIds =
        draggedTask.tags?.map((tag) =>
          typeof tag === "object" ? tag.id : tag,
        ) || [];
      await axios.put(`/api/projects/${projectId}/tasks/${activeId}`, {
        ...draggedTask,
        status: newStatus,
        assigned_to: draggedTask.assigned_to_id || draggedTask.assigned_to, // Ensure ID is sent
        tags: tagIds,
      });
    } catch {
      onTasksChange(originalTasks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            column={col}
            tasks={tasks.filter((t) => t.status === col)}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            onTasksChange([...tasks]);
            setSelectedTask(null);
          }}
        />
      )}
    </DndContext>
  );
}
