# Gather.io MVP — Cursor Build Plan (MongoDB)

## Project overview

Build a simplified virtual space app where users can create an organization, enter a room, see other members as avatars, and click an avatar to open a 1-on-1 chat. Target: up to 5 concurrent users per room.

**Stack:** Node.js + Express, Socket.io, vanilla JS frontend (no frameworks), MongoDB via Mongoose, JWT auth.

---

## Folder structure to generate first

```
gather-mvp/
├── server/
│   ├── index.js              # Entry point
│   ├── db.js                 # Mongoose connection + all models
│   ├── auth.js               # JWT helpers + requireAuth middleware
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/register, /api/auth/login
│   │   ├── orgs.js           # POST /api/orgs, GET /api/orgs/:slug, POST /api/orgs/:slug/join
│   │   └── rooms.js          # GET /api/rooms/:roomId/messages
│   └── socket/
│       └── roomHandler.js    # All Socket.io events
├── client/
│   ├── index.html            # Single HTML shell
│   ├── style.css
│   └── js/
│       ├── app.js            # Router / page switcher
│       ├── auth.js           # Login + register forms
│       ├── org.js            # Create org + dashboard
│       ├── room.js           # Room canvas + avatar grid
│       └── chat.js           # Chat panel logic
├── package.json
└── .env
```

---

## Step 1 — Project setup

**Prompt to Cursor:**

> Create the folder structure above. Then initialize a Node project with these dependencies: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `socket.io`, `cors`, `dotenv`. Create a `.env` file with these values:
>
> ```
> PORT=3000
> JWT_SECRET=changeme
> MONGODB_URI=mongodb+srv://marwankhalil2002_db_user:Komws2002@cluster0.lnwl21s.mongodb.net/
> ```
>
> Add a `start` script in `package.json` that runs `node server/index.js`. Add a `dev` script that runs `node --watch server/index.js`.

---

## Step 2 — Database connection and models

**Prompt to Cursor:**

> In `server/db.js`, do two things:
>
> **1. Connect to MongoDB** using Mongoose and `process.env.MONGODB_URI`. Export an async `connectDB()` function that logs "MongoDB connected" on success and throws on error.
>
> **2. Define and export all 5 Mongoose models:**
>
> **User**
> ```
> username        String, required, unique, trim
> password_hash   String, required
> avatar_color    String, default '#6C63FF'
> created_at      Date, default Date.now
> ```
>
> **Organization**
> ```
> name        String, required, trim
> slug        String, required, unique, lowercase, trim
> owner_id    ObjectId, ref 'User', required
> created_at  Date, default Date.now
> ```
>
> **OrgMember**
> ```
> org_id      ObjectId, ref 'Organization', required
> user_id     ObjectId, ref 'User', required
> role        String, enum ['owner','member'], default 'member'
> joined_at   Date, default Date.now
> ```
> Add a compound unique index: `{ org_id: 1, user_id: 1 }`.
>
> **Room**
> ```
> org_id      ObjectId, ref 'Organization', required
> name        String, required, trim
> created_at  Date, default Date.now
> ```
>
> **Message**
> ```
> room_id     ObjectId, ref 'Room', required
> sender_id   ObjectId, ref 'User', required
> receiver_id ObjectId, ref 'User', required
> body        String, required, trim
> created_at  Date, default Date.now
> ```
> Add an index: `{ room_id: 1, created_at: -1 }`.
>
> Export all models as named exports: `{ connectDB, User, Organization, OrgMember, Room, Message }`.

---

## Step 3 — Auth helpers and middleware

**Prompt to Cursor:**

> In `server/auth.js`, write and export three things using `jsonwebtoken` and `process.env.JWT_SECRET`:
>
> **`signToken(userId)`** — signs and returns a JWT with `{ userId }` as payload, expires in `'7d'`.
>
> **`verifyToken(token)`** — verifies and returns the decoded payload. Throws if invalid.
>
> **`requireAuth` middleware** — reads the `Authorization` header, expects `Bearer <token>`, calls `verifyToken`, then looks up the user in MongoDB using the `User` model (exclude `password_hash` with `.select('-password_hash')`). Attaches the user document to `req.user`. If the token is missing, invalid, or the user is not found, respond with `401` and a JSON error message.

---

## Step 4 — Auth routes

**Prompt to Cursor:**

> In `server/routes/auth.js`, create an Express router and export it. Use `bcryptjs` for password hashing and the `User` model and `signToken` from `server/auth.js`.
>
> **POST `/api/auth/register`**
> - Accepts `{ username, password }` from `req.body`
> - Validate both fields are present and `password` is at least 6 characters
> - Check if `username` already exists — if so return `409` with message "Username already taken"
> - Hash the password with `bcrypt.hash(password, 10)`
> - Create and save the new User document
> - Return `201` with `{ token, user: { _id, username, avatar_color } }`
>
> **POST `/api/auth/login`**
> - Accepts `{ username, password }`
> - Find the user by username — if not found return `401` with "Invalid credentials"
> - Compare password with `bcrypt.compare` — if wrong return `401` with "Invalid credentials"
> - Return `200` with `{ token, user: { _id, username, avatar_color } }`
>
> Wrap both handlers in try/catch and return `500` on unexpected errors.

---

## Step 5 — Org routes

**Prompt to Cursor:**

> In `server/routes/orgs.js`, create an Express router. Import `requireAuth` from `server/auth.js` and `{ Organization, OrgMember, Room, User }` from `server/db.js`. Apply `requireAuth` to all routes.
>
> **POST `/api/orgs`**
> - Accepts `{ name, slug }` from `req.body`
> - Validate both fields are present. Validate slug matches `/^[a-z0-9-]+$/` — return `400` if not
> - Check if slug already exists — return `409` if taken
> - Create the Organization document with `owner_id: req.user._id`
> - Create an OrgMember document with `role: 'owner'`
> - Create a Room document with `name: 'Main Room'` linked to the new org
> - Return `201` with `{ org, room }`
>
> **GET `/api/orgs/:slug`**
> - Find the org by slug — return `404` if not found
> - Find all OrgMember documents for this org, populate `user_id` selecting `_id username avatar_color`
> - Find all Room documents for this org
> - Check if `req.user` is a member (search the members list)
> - Return `200` with `{ org, members, rooms, isMember }`
>
> **POST `/api/orgs/:slug/join`**
> - Find org by slug — return `404` if not found
> - Use `OrgMember.findOneAndUpdate` with `upsert: true` to add the user as a member (role: 'member') — this prevents duplicate joins
> - Return `200` with `{ message: 'Joined successfully' }`

---

## Step 6 — Room/messages route

**Prompt to Cursor:**

> In `server/routes/rooms.js`, create an Express router. Import `requireAuth` from `server/auth.js` and `{ Message }` from `server/db.js`. Apply `requireAuth` to all routes.
>
> **GET `/api/rooms/:roomId/messages`**
> - Read `withUser` from `req.query` — return `400` if missing
> - Query the Message collection for documents where `room_id` matches `:roomId` AND the message is between the current user and the other user in either direction:
>   ```
>   { room_id, $or: [
>     { sender_id: req.user._id, receiver_id: withUser },
>     { sender_id: withUser, receiver_id: req.user._id }
>   ]}
>   ```
> - Sort by `created_at: 1`, limit to 50
> - Populate `sender_id` selecting `_id username avatar_color`
> - Return `200` with the messages array

---

## Step 7 — Express server entry point

**Prompt to Cursor:**

> In `server/index.js`:
>
> 1. Load `dotenv` at the very top with `require('dotenv').config()`
> 2. Import `connectDB` from `server/db.js` and call it before anything else — use an async IIFE to await it
> 3. Set up Express with `cors()` and `express.json()` middleware
> 4. Mount routes:
>    - `server/routes/auth.js` at `/api/auth`
>    - `server/routes/orgs.js` at `/api/orgs`
>    - `server/routes/rooms.js` at `/api/rooms`
> 5. Add a root GET `/` route that returns `{ status: 'ok' }`
> 6. Create an `http.Server` from the Express app
> 7. Attach Socket.io to the HTTP server with `cors: { origin: '*' }`
> 8. Import `registerRoomHandler` from `server/socket/roomHandler.js` and call it with `io`
> 9. Start listening on `process.env.PORT` and log the port

---

## Step 8 — Socket.io room handler

**Prompt to Cursor:**

> In `server/socket/roomHandler.js`, export a function `registerRoomHandler(io)`.
>
> At the top of the file, create an in-memory Map: `const onlineUsers = new Map()` — keyed by `roomId`, value is a Map of `socketId → { userId, username, avatar_color }`.
>
> **On connection:**
> - Read `socket.handshake.auth.token` and verify it using `verifyToken` from `server/auth.js`
> - Look up the user in MongoDB using the `User` model
> - If invalid or user not found, call `socket.disconnect()` and return
> - Attach `socket.user` = the user document
>
> **Event: `room:join`** — payload `{ roomId }`
> - Call `socket.join('room:' + roomId)`
> - Add the user to `onlineUsers` map under this roomId
> - Broadcast `user:joined` to the room (excluding this socket) with `{ userId, username, avatar_color, socketId: socket.id }`
> - Emit `room:state` back to this socket only with the current array of users in this room (everyone except the joining user)
>
> **Event: `room:leave`** — payload `{ roomId }`
> - Call the shared `leaveRoom(socket, roomId)` helper (see below)
>
> **Event: `message:send`** — payload `{ roomId, receiverId, body }`
> - Save a new Message document to MongoDB
> - Find the receiver's socket in `onlineUsers` for this room
> - Emit `message:receive` to the sender socket and, if the receiver is online, to their socket too — payload is the saved message with `sender_id` populated
>
> **On disconnect:**
> - Loop through all rooms in `onlineUsers` and call `leaveRoom` for any room this socket was in
>
> **`leaveRoom(socket, roomId)` helper:**
> - Remove the socket from `onlineUsers` for this roomId
> - Delete the roomId entry if the Map is now empty
> - Broadcast `user:left` to the room with `{ socketId: socket.id }`

---

## Step 9 — Frontend HTML shell

**Prompt to Cursor:**

> Create `client/index.html` as a minimal single-page app shell with:
>
> - Standard HTML5 boilerplate, charset UTF-8, viewport meta tag
> - Title: "Gather MVP"
> - Link to `style.css`
> - A single `<div id="app"></div>` as the mount point
> - Load Socket.io client from CDN: `https://cdn.socket.io/4.7.2/socket.io.min.js`
> - Load all JS files as `type="module"` scripts in this order: `js/app.js`, `js/auth.js`, `js/org.js`, `js/room.js`, `js/chat.js`
>
> Also configure Express in `server/index.js` to serve the `client/` folder as static files using `express.static('client')`.

---

## Step 10 — Frontend router (app.js)

**Prompt to Cursor:**

> In `client/js/app.js`, write a hash-based client-side router and export shared helpers.
>
> **LocalStorage helpers:**
> - `saveSession(token, user)` — saves both to localStorage as `gather_token` and `gather_user` (JSON)
> - `getToken()` — returns the stored token or null
> - `getUser()` — returns the parsed user object or null
> - `clearSession()` — removes both keys
>
> **API helper:**
> - `apiFetch(path, options = {})` — a wrapper around `fetch` that prepends `/api` to the path, automatically adds `Content-Type: application/json` and `Authorization: Bearer <token>` headers if a token exists, and returns the parsed JSON response. If the response status is 401, call `clearSession()` and navigate to `#/`.
>
> **Router:**
> - Export a `navigate(hash)` function that sets `window.location.hash = hash`
> - Listen to `window.addEventListener('hashchange', route)` and call `route()` on page load
> - `route()` reads `window.location.hash` and renders the correct page:
>   - `#/` or empty → if logged in, call `renderOrgPrompt()`, else call `renderAuth()`
>   - `#/create-org` → call `renderCreateOrg()`
>   - `#/org/:slug` → call `renderOrgDashboard(slug)`
>   - `#/room/:slug/:roomId` → call `renderRoom(slug, roomId)`
> - Import `renderAuth` from `auth.js`, `renderCreateOrg` and `renderOrgDashboard` from `org.js`, `renderRoom` from `room.js`
>
> **`renderOrgPrompt()`** — renders a simple logged-in home screen inside `#app` showing "Welcome, {username}" and two buttons: "Create an organization" (navigates to `#/create-org`) and "Log out" (clears session, navigates to `#/`).

---

## Step 11 — Auth UI (auth.js)

**Prompt to Cursor:**

> In `client/js/auth.js`, export a `renderAuth()` function. Import `apiFetch`, `saveSession`, `navigate` from `app.js`.
>
> Render into `document.querySelector('#app')` a centered card with:
> - An `<h1>` that says "Gather"
> - A mode toggle: two text buttons "Sign in" and "Register" that switch the form between login and register modes
> - A form with:
>   - Username input (always shown)
>   - Password input (always shown)
>   - A submit button that says "Sign in" or "Register" depending on mode
>   - An error message `<p>` below the button, hidden by default
>
> **On submit (login mode):**
> - Call `POST /api/auth/login` with `{ username, password }`
> - On success: call `saveSession(token, user)` then `navigate('#/')`
> - On error: show the error message returned by the API
>
> **On submit (register mode):**
> - Call `POST /api/auth/register` with `{ username, password }`
> - On success: call `saveSession(token, user)` then `navigate('#/')`
> - On error: show the error message
>
> Disable the submit button while the request is in flight.

---

## Step 12 — Org UI (org.js)

**Prompt to Cursor:**

> In `client/js/org.js`, export two functions. Import `apiFetch`, `navigate`, `getUser` from `app.js`.
>
> **`renderCreateOrg()`**
> - Renders a centered form into `#app` with:
>   - Back button (navigates to `#/`)
>   - `<h2>` "Create your organization"
>   - Org name input
>   - Slug input (auto-populates from org name: lowercase, spaces replaced with hyphens)
>   - Submit button "Create"
>   - Error message area
> - On submit: call `POST /api/orgs` with `{ name, slug }`
> - On success: `navigate('#/org/' + slug)`
> - On error: show the API error message
>
> **`renderOrgDashboard(slug)`**
> - Call `GET /api/orgs/:slug` — if 404, render "Org not found" message
> - If `isMember` is false, render a "Join this organization" button that calls `POST /api/orgs/:slug/join` then re-renders the dashboard
> - Otherwise render:
>   - `<h1>` with the org name
>   - A "Members" section: flex row of avatar circles — each is a colored `<div>` with the member's initials centered, and their username below. Use the member's `avatar_color` as the background.
>   - A "Rooms" section: for each room render a clickable card showing the room name. Clicking navigates to `#/room/:slug/:roomId`
>   - An "Invite people" button that runs `navigator.clipboard.writeText(window.location.origin + '/#/org/' + slug)` and briefly changes its text to "Link copied!"
>   - A "Log out" button that clears the session and navigates to `#/`

---

## Step 13 — Room canvas (room.js)

**Prompt to Cursor:**

> In `client/js/room.js`, export a `renderRoom(slug, roomId)` function. Import `getToken`, `getUser`, `navigate` from `app.js`. Import `initChat`, `openChat` from `chat.js`.
>
> **Layout:** Render into `#app` a full-height flex row layout:
> - `.canvas-area` — takes remaining space, holds the avatar grid and room header
> - `.chat-sidebar` — 300px wide, hidden (`display: none`) by default, revealed when a chat is opened
>
> **Room header (inside `.canvas-area`):**
> - Room name on the left
> - "Leave room" button on the right — on click: emit `room:leave`, disconnect the socket, navigate to `#/org/:slug`
>
> **Avatar grid:** a CSS grid inside `.canvas-area` for the avatar cards. Each card contains:
> - A circle `<div>` with the user's `avatar_color` as background and their initials centered in white
> - Username `<p>` below
> - If the card is for another user: `cursor: pointer` and a click handler that calls `openChat(user)` and adds class `.active` to this card (removes it from others)
> - If the card is for the current user: add a "(you)" label, no click handler
>
> **Socket connection:**
> - Connect to Socket.io with `{ auth: { token: getToken(), roomId } }`
> - On connect: emit `room:join` with `{ roomId }`
> - On `room:state` `(users)`: render all users into the grid
> - On `user:joined` `(user)`: add that user's card to the grid
> - On `user:left` `({ socketId })`: remove the card matching that socketId
> - On disconnect: clean up
>
> **Call `initChat(socket, currentUser, roomId)`** after setting up socket listeners, passing the socket instance so the chat module can use it.
>
> Store the socket in a module-level variable so `openChat` can emit through it.

---

## Step 14 — Chat panel (chat.js)

**Prompt to Cursor:**

> In `client/js/chat.js`, export two functions: `initChat(socket, currentUser, roomId)` and `openChat(otherUser)`. Import `apiFetch` from `app.js`.
>
> **Module-level state:** store `currentSocket`, `currentUser`, `currentRoomId`, `activeChatUser`, and a `pendingNotifications` Set (socketIds with unread messages).
>
> **`initChat(socket, currentUser, roomId)`**
> - Store all three in module-level variables
> - Listen for `message:receive` on the socket
> - When a message arrives: if `activeChatUser` exists and the message `sender_id._id` matches `activeChatUser._id`, call `appendMessage(message)`. Otherwise add the sender's socketId to `pendingNotifications` and add a red dot to that user's avatar card in the grid (find the card by socketId data attribute).
>
> **`openChat(otherUser)`**
> - Set `activeChatUser = otherUser`
> - Remove the notification dot from that user's avatar card
> - Remove them from `pendingNotifications`
> - Show `.chat-sidebar` (set `display: flex`, flex direction column)
> - Render the sidebar HTML:
>   - Header with the other user's avatar circle, their username, and a close button (×)
>   - `.messages-container` div (scrollable, flex column)
>   - Message input area at the bottom: text input + "Send" button
> - Call `apiFetch('/rooms/' + currentRoomId + '/messages?withUser=' + otherUser._id)` and render each message using `appendMessage`
> - Scroll `.messages-container` to the bottom
> - Focus the text input
>
> **Close button handler:** set `activeChatUser = null`, hide `.chat-sidebar`, remove `.active` from all avatar cards.
>
> **Send button / Enter key handler:**
> - Read the input value, trim it, return if empty
> - Emit `message:send` via `currentSocket` with `{ roomId: currentRoomId, receiverId: otherUser._id, body }`
> - Optimistically call `appendMessage({ sender_id: { _id: currentUser._id }, body, created_at: new Date() })`
> - Clear the input
>
> **`appendMessage(message)` (internal helper):**
> - Create a `<div class="bubble">` element
> - If `message.sender_id._id === currentUser._id` add class `sent`, else add class `received`
> - Set inner text to `message.body`
> - Append to `.messages-container` and scroll it to the bottom

---

## Step 15 — Styling (style.css)

**Prompt to Cursor:**

> Write `client/style.css` with these styles. Use CSS variables at the top:
> ```css
> :root {
>   --primary: #6C63FF;
>   --primary-light: #EEEdFF;
>   --text: #333;
>   --muted: #888;
>   --border: #e0e0e0;
>   --bg: #ffffff;
>   --surface: #f7f7f7;
> }
> ```
>
> **Global:** box-sizing border-box on everything, margin 0, font: system-ui, color: var(--text), background: var(--bg).
>
> **`#app`:** width 100vw, height 100vh, overflow hidden.
>
> **Auth card** (`.auth-card`): centered on screen using flex on `#app`, max-width 380px, padding 40px, border 1px solid var(--border), border-radius 12px. `<h1>` font-size 28px, margin-bottom 8px. Mode toggle buttons: no background, no border, color var(--muted), font-size 14px, cursor pointer. Active mode toggle: color var(--primary), font-weight 500, border-bottom 2px solid var(--primary).
>
> **Form inputs:** width 100%, padding 10px 12px, border 1px solid var(--border), border-radius 8px, font-size 15px, margin-bottom 12px. Focus outline: 2px solid var(--primary).
>
> **Primary button** (`.btn-primary`): background var(--primary), color white, border none, padding 10px 20px, border-radius 8px, font-size 15px, cursor pointer, width 100%. Hover: opacity 0.9. Disabled: opacity 0.6, cursor not-allowed.
>
> **Secondary button** (`.btn-secondary`): background transparent, border 1px solid var(--border), color var(--text), padding 8px 16px, border-radius 8px, cursor pointer. Hover: background var(--surface).
>
> **Error text** (`.error-msg`): color #e53e3e, font-size 13px, margin-top 4px.
>
> **Org dashboard** (`.org-dashboard`): max-width 720px, margin 0 auto, padding 32px 24px. Section headings: font-size 13px, font-weight 500, color var(--muted), text-transform uppercase, letter-spacing 0.05em, margin-bottom 12px.
>
> **Member avatars** (`.member-list`): display flex, flex-wrap wrap, gap 16px. Each `.avatar-wrap`: display flex, flex-direction column, align-items center, gap 6px. Avatar circle (`.avatar-circle`): width 48px, height 48px, border-radius 50%, display flex, align-items center, justify-content center, color white, font-weight 500, font-size 16px.
>
> **Room card** (`.room-card`): padding 16px 20px, border 1px solid var(--border), border-radius 10px, cursor pointer, font-size 15px, font-weight 500. Hover: border-color var(--primary), background var(--primary-light).
>
> **Room layout:** `#app` when in room mode uses `display: flex`. `.canvas-area`: flex 1, display flex, flex-direction column, overflow hidden. `.room-header`: display flex, justify-content space-between, align-items center, padding 12px 20px, border-bottom 1px solid var(--border). `.avatar-grid`: flex 1, display grid, grid-template-columns repeat(3, auto), align-content start, gap 24px, padding 32px, overflow-y auto.
>
> **Avatar card** (`.avatar-card`): display flex, flex-direction column, align-items center, gap 8px. Large avatar circle in room: width 72px, height 72px, font-size 24px. Username: font-size 13px, color var(--muted). Clickable cards: cursor pointer. Hover: transform scale(1.05), transition 0.15s. `.avatar-card.active` circle: outline 3px solid var(--primary), outline-offset 3px.
>
> **Notification dot** (`.notif-dot`): width 10px, height 10px, background #e53e3e, border-radius 50%, position absolute, top 0, right 0 on the avatar circle (which needs position relative).
>
> **Chat sidebar** (`.chat-sidebar`): width 300px, border-left 1px solid var(--border), display flex, flex-direction column. `.chat-header`: padding 12px 16px, border-bottom 1px solid var(--border), display flex, align-items center, gap 10px. Close button: margin-left auto, background none, border none, font-size 20px, cursor pointer, color var(--muted). `.messages-container`: flex 1, overflow-y auto, padding 16px, display flex, flex-direction column, gap 8px. `.message-input-area`: padding 12px, border-top 1px solid var(--border), display flex, gap 8px. Message input: flex 1, padding 8px 12px, border 1px solid var(--border), border-radius 20px, font-size 14px. Send button: background var(--primary), color white, border none, padding 8px 16px, border-radius 20px, cursor pointer.
>
> **Chat bubbles** (`.bubble`): max-width 75%, padding 8px 12px, border-radius 12px, font-size 14px, line-height 1.4, word-break break-word. `.sent`: align-self flex-end, background var(--primary), color white, border-bottom-right-radius 4px. `.received`: align-self flex-start, background var(--surface), color var(--text), border-bottom-left-radius 4px.

---

## Step 16 — Wire everything together and test

**Prompt to Cursor:**

> Review all files and verify the following, fixing anything that is broken:
>
> 1. `server/index.js` calls `connectDB()` before starting the server, mounts all routes, and serves the `client/` folder as static files
> 2. `client/index.html` loads Socket.io from CDN before the JS modules
> 3. All `apiFetch` calls in the client correctly include the JWT header
> 4. The router in `app.js` correctly parses hash params like `#/org/my-org` and `#/room/my-org/64abc123`
> 5. `room.js` passes the socket instance to `chat.js` via `initChat`
> 6. Avatar cards have a `data-socket-id` attribute set so `chat.js` can find and update them
> 7. Each avatar circle in the room has `position: relative` so the notification dot positions correctly
>
> Then run `npm start` and manually test this complete flow in two separate browser tabs:
>
> - Tab 1: Register as "alice", create org "test-org"
> - Tab 2: Register as "bob", navigate to `/#/org/test-org`, join the org, enter Main Room
> - Tab 1: Enter Main Room — both users should see each other's avatars
> - Tab 1: Click bob's avatar, send a message
> - Tab 2: Message appears in real time
> - Tab 2: Click alice's avatar, reply
> - Tab 1: Reply appears, notification dot shows if chat panel is closed
>
> Fix any issues found.

---

## What's intentionally left out of MVP

These are v2 features — do not build them now:

- Avatar movement / WASD controls
- Video or audio (WebRTC)
- Multiple rooms per org
- Tile maps or backgrounds
- Group chat
- Emoji reactions
- Persistent online status (beyond the current socket session)
- Email invites
- Avatar customization beyond color
