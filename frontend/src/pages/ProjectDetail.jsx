import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import KanbanBoard from "../components/KanbanBoard";
import CreateTaskModal from "../components/CreateTaskModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`/api/projects/${id}`),
        axios.get(`/api/projects/${id}/tasks`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white">
            {project?.name}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {project?.description || "No description provided."}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          + Create Task
        </button>
        {showModal && (
          <CreateTaskModal
            onClose={() => setShowModal(false)}
            onCreated={fetchData}
            projectId={id}
          />
        )}
      </div>

      <KanbanBoard tasks={tasks} onTasksChange={setTasks} projectId={id} />
    </div>
  );
}
