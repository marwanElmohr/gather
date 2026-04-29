import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Room() {
  const { slug, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [unreadBySocket, setUnreadBySocket] = useState({});
  const activeUserRef = useRef(null);
  const usersRef = useRef([]);

  const currentUserId = useMemo(() => String(user?.id || user?._id || ""), [user]);
  const socketServerUrl = useMemo(
    () => import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : "/"),
    [],
  );

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return undefined;
    }

    const socketInstance = io(socketServerUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("room:join", { roomId });
    });

    socketInstance.on("connect_error", (err) => {
      const reason = err?.message ? ` (${err.message})` : "";
      setError(`Realtime connection failed${reason}.`);
    });

    socketInstance.on("disconnect", () => {
      setUsers([]);
      setActiveUser(null);
      setMessages([]);
    });

    socketInstance.on("room:state", (stateUsers) => {
      setUsers(stateUsers || []);
    });

    socketInstance.on("user:joined", (joinedUser) => {
      setUsers((prev) => {
        if (prev.some((u) => u.socketId === joinedUser.socketId)) return prev;
        return [...prev, joinedUser];
      });
    });

    socketInstance.on("user:left", ({ socketId }) => {
      setUsers((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    socketInstance.on("message:receive", (message) => {
      const senderId = String(message?.sender_id?._id || "");

      const currentActiveUser = activeUserRef.current;
      const activeUserId = String(currentActiveUser?.userId || currentActiveUser?._id || "");
      const shouldShow = currentActiveUser && (senderId === activeUserId || senderId === currentUserId);

      if (shouldShow) {
        setMessages((prev) => [...prev, message]);
      } else if (senderId && senderId !== currentUserId) {
        setUnreadBySocket((prev) => {
          const senderSocket = usersRef.current.find((u) => String(u.userId) === senderId)?.socketId;
          if (!senderSocket) return prev;
          return { ...prev, [senderSocket]: true };
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit("room:leave", { roomId });
      socketInstance.disconnect();
    };
  }, [roomId, navigate, currentUserId, socketServerUrl]);

  const openChat = async (otherUser) => {
    setActiveUser(otherUser);
    setUnreadBySocket((prev) => {
      const next = { ...prev };
      delete next[otherUser.socketId];
      return next;
    });
    setError("");
    try {
      const res = await axios.get(`/api/rooms/${roomId}/messages?withUser=${otherUser.userId}`);
      setMessages(res.data || []);
    } catch (_err) {
      setMessages([]);
      setError("Failed to load messages.");
    }
  };

  const sendMessage = () => {
    const body = messageText.trim();
    if (!socket || !activeUser || !body) return;

    socket.emit("message:send", {
      roomId,
      receiverId: activeUser.userId,
      body,
    });

    setMessageText("");
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      <div className="flex-1 bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white">Room</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {slug} / {roomId}
            </p>
          </div>
          <button
            onClick={() => navigate("/orgs")}
            className="px-4 py-2 border-2 border-black dark:border-white text-black dark:text-white rounded-lg font-bold"
          >
            Leave Room
          </button>
        </div>

        <h2 className="font-bold dark:text-white mb-3">Online users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {users.map((u) => (
            <button
              key={u.socketId}
              onClick={() => openChat(u)}
              className={`text-left p-3 rounded-xl border ${
                activeUser?.socketId === u.socketId
                  ? "border-black dark:border-white"
                  : "border-neutral-200 dark:border-neutral-600"
              } relative`}
            >
              <p className="font-semibold text-black dark:text-white">{u.username}</p>
              <p className="text-xs text-neutral-500">Socket: {u.socketId.slice(0, 6)}...</p>
              {unreadBySocket[u.socketId] && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No other users online.</p>
          )}
        </div>
      </div>

      <div className="w-[360px] bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col">
        <h2 className="font-bold dark:text-white mb-2">
          {activeUser ? `Chat with ${activeUser.username}` : "Select a user"}
        </h2>
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="flex-1 overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 space-y-2">
          {messages.map((m, idx) => {
            const senderId = String(m?.sender_id?._id || "");
            const isMine = senderId === currentUserId;
            return (
              <div
                key={`${senderId}-${m.created_at || idx}-${idx}`}
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  isMine
                    ? "ml-auto bg-black text-white dark:bg-white dark:text-black"
                    : "bg-neutral-100 dark:bg-neutral-700 text-black dark:text-white"
                }`}
              >
                {m.body}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Type message..."
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!activeUser}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
