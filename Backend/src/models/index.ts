import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "instructor", "admin"], default: "student", required: true },
  bio: { type: String, maxlength: 500, default: "" },
  avatar: { type: String, default: "" }
}, { timestamps: true });

const lessonSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  duration: { type: Number, min: 0, default: 0 },
  type: { type: String, enum: ["text", "video"], default: "text" },
  content: { type: String, default: "" },
  resourceUrl: { type: String }
}, { _id: false });
const moduleSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  lessons: { type: [lessonSchema], default: [] }
}, { _id: false });

const courseSchema = new Schema({
  _id: { type: String },
  slug: { type: String, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  category: { type: String, required: true },
  level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
  duration: { type: String, default: "" },
  image: { type: String, default: "" },
  instructorId: { type: String, ref: "User", required: true, index: true },
  instructorName: { type: String, required: true },
  status: { type: String, enum: ["draft", "pending", "published", "rejected", "archived"], default: "draft", index: true },
  outcomes: [{ type: String }],
  prerequisites: [{ type: String }],
  modules: { type: [moduleSchema], default: [] }
}, { timestamps: true });

const enrollmentSchema = new Schema({
  _id: { type: String },
  userId: { type: String, ref: "User", required: true },
  courseId: { type: String, ref: "Course", required: true },
  completedLessonIds: [{ type: String }],
  lastLessonId: String,
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const assessmentSchema = new Schema({
  _id: { type: String },
  courseId: { type: String, ref: "Course", required: true, index: true },
  title: { type: String, required: true },
  passingScore: { type: Number, min: 0, max: 100, default: 70 },
  questions: [{
    id: { type: String, required: true },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, min: 0 }
  }]
}, { timestamps: true });

const quizAttemptSchema = new Schema({
  _id: { type: String },
  assessmentId: { type: String, ref: "Assessment", required: true },
  userId: { type: String, ref: "User", required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const certificateSchema = new Schema({
  _id: { type: String },
  userId: { type: String, ref: "User", required: true },
  courseId: { type: String, ref: "Course", required: true },
  certificateId: { type: String, unique: true, required: true, index: true },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const categorySchema = new Schema({ name: { type: String, unique: true, required: true } }, { timestamps: true });
const bookmarkSchema = new Schema({
  _id: { type: String },
  userId: { type: String, ref: "User", required: true },
  courseId: { type: String, ref: "Course", required: true }
}, { timestamps: true });
bookmarkSchema.index({ userId: 1, courseId: 1 }, { unique: true });
const notificationSchema = new Schema({
  userId: { type: String, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readAt: Date
}, { timestamps: true });
const passwordResetSchema = new Schema({
  _id: { type: String },
  userId: { type: String, ref: "User", required: true, index: true },
  tokenHash: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });
const contactMessageSchema = new Schema({
  _id: { type: String },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, required: true, trim: true, maxlength: 3000 }
}, { timestamps: true });

export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
export const CourseModel = mongoose.models.Course ?? mongoose.model("Course", courseSchema);
export const EnrollmentModel = mongoose.models.Enrollment ?? mongoose.model("Enrollment", enrollmentSchema);
export const AssessmentModel = mongoose.models.Assessment ?? mongoose.model("Assessment", assessmentSchema);
export const QuizAttemptModel = mongoose.models.QuizAttempt ?? mongoose.model("QuizAttempt", quizAttemptSchema);
export const CertificateModel = mongoose.models.Certificate ?? mongoose.model("Certificate", certificateSchema);
export const CategoryModel = mongoose.models.Category ?? mongoose.model("Category", categorySchema);
export const BookmarkModel = mongoose.models.Bookmark ?? mongoose.model("Bookmark", bookmarkSchema);
export const NotificationModel = mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);
export const PasswordResetModel = mongoose.models.PasswordReset ?? mongoose.model("PasswordReset", passwordResetSchema);
export const ContactMessageModel = mongoose.models.ContactMessage ?? mongoose.model("ContactMessage", contactMessageSchema);
