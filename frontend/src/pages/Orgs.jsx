import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Orgs() {
  const navigate = useNavigate();
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [joinSlug, setJoinSlug] = useState("");
  const [orgData, setOrgData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrg = async (slug) => {
    const normalizedSlug = String(slug || "").trim().toLowerCase();
    if (!normalizedSlug) return;
    const res = await axios.get(`/api/orgs/${normalizedSlug}`);
    setOrgData(res.data);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedSlug = createSlug.trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
        throw new Error("Slug must use lowercase letters, numbers, and hyphens only.");
      }

      const res = await axios.post("/api/orgs", {
        name: createName.trim(),
        slug: normalizedSlug,
      });

      setCreateName("");
      setCreateSlug("");
      await loadOrg(res.data.org.slug);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to create org.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedSlug = joinSlug.trim().toLowerCase();
      await axios.post(`/api/orgs/${normalizedSlug}/join`);
      await loadOrg(normalizedSlug);
      setJoinSlug("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to join org.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-black dark:text-white mb-2">Organizations</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Create an organization or join one by slug.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form
          onSubmit={handleCreateOrg}
          className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm space-y-3"
        >
          <h2 className="text-xl font-bold dark:text-white">Create Organization</h2>
          <input
            type="text"
            placeholder="Organization name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white"
            required
          />
          <input
            type="text"
            placeholder="Slug (e.g. test-org)"
            value={createSlug}
            onChange={(e) => setCreateSlug(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg disabled:opacity-50"
          >
            Create
          </button>
        </form>

        <form
          onSubmit={handleJoinOrg}
          className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm space-y-3"
        >
          <h2 className="text-xl font-bold dark:text-white">Join Organization</h2>
          <input
            type="text"
            placeholder="Organization slug"
            value={joinSlug}
            onChange={(e) => setJoinSlug(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 border-2 border-black dark:border-white text-black dark:text-white font-bold rounded-lg disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </div>

      {orgData && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-bold dark:text-white">{orgData.org?.name}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            slug: {orgData.org?.slug} {orgData.isMember ? "(member)" : "(not a member)"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold dark:text-white mb-2">Members</h4>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {orgData.members?.map((m) => (
                  <li key={m.id || m._id}>
                    {(m.user_id?.username || m.user_id?.name || "Unknown user")} - {m.role}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold dark:text-white mb-2">Rooms</h4>
              <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {orgData.rooms?.map((r) => (
                  <li key={r.id || r._id} className="flex items-center justify-between gap-2">
                    <span>{r.name}</span>
                    <button
                      onClick={() => navigate(`/room/${orgData.org?.slug}/${r.id || r._id}`)}
                      className="px-2 py-1 text-xs rounded-md border border-neutral-300 dark:border-neutral-600"
                    >
                      Enter
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
