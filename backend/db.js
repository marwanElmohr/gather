const mongoose = require("mongoose");

function withIdTransform(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  });
}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    avatar_color: { type: String, default: "#6C63FF" },
    profile_picture: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(userSchema);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact_name: { type: String, required: true, trim: true },
    contact_email: { type: String, required: true, trim: true },
    contact_phone: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(clientSchema);

const projectSchema = new mongoose.Schema(
  {
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    start_date: { type: Date, required: true },
    end_date: { type: Date, default: null },
    status: { type: String, required: true },
    priority: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(projectSchema);

const projectMemberSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    joined_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
projectMemberSchema.index({ project_id: 1, user_id: 1 }, { unique: true });
withIdTransform(projectMemberSchema);

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { versionKey: false },
);
withIdTransform(tagSchema);

const taskSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    due_date: { type: Date, required: true },
    status: { type: String, required: true },
    priority: { type: String, required: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    completed_at: { type: Date, default: null },
    tag_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(taskSchema);

const commentSchema = new mongoose.Schema(
  {
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(commentSchema);

const attachmentSchema = new mongoose.Schema(
  {
    file_name: { type: String, required: true, trim: true },
    file_path: { type: String, required: true, trim: true },
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);
withIdTransform(attachmentSchema);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
withIdTransform(organizationSchema);

const orgMemberSchema = new mongoose.Schema(
  {
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    joined_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
orgMemberSchema.index({ org_id: 1, user_id: 1 }, { unique: true });
withIdTransform(orgMemberSchema);

const roomSchema = new mongoose.Schema(
  {
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
withIdTransform(roomSchema);

const messageSchema = new mongoose.Schema(
  {
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
messageSchema.index({ room_id: 1, created_at: -1 });
withIdTransform(messageSchema);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
const ProjectMember =
  mongoose.models.ProjectMember || mongoose.model("ProjectMember", projectMemberSchema);
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
const Attachment =
  mongoose.models.Attachment || mongoose.model("Attachment", attachmentSchema);
const Organization =
  mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
const OrgMember = mongoose.models.OrgMember || mongoose.model("OrgMember", orgMemberSchema);
const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

module.exports = {
  connectDB,
  User,
  Client,
  Project,
  ProjectMember,
  Task,
  Tag,
  Comment,
  Attachment,
  Organization,
  OrgMember,
  Room,
  Message,
};
