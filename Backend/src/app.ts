import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z, ZodError } from "zod";
import { databaseHealth, databaseMode } from "./config/database";
import { repository } from "./data/repository";
import { loadDemoData, createDemoData } from "./services/seedData";
import { lessonIds, progressPercent } from "./services/progress";
import type { Certificate, Course, Role, User } from "./types/domain";
import { HttpError } from "./utils/errors";
import { canIssueCertificate, canManageCourse, gradeAssessment, roleAllowed } from "./services/workflows";

const mode = databaseMode();
const passwordResetTokens = new Map<string, { userId: string; expiresAt: number }>();
const contactMessages: Array<{ name: string; email: string; message: string; createdAt: string }> = [];

declare global {
  namespace Express {
    interface Request { currentUser?: User }
  }
}

const app = express();
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters. Set it in Backend/.env before starting the API.");
}

const adminEmail = process.env.ASTER_DEMO_ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ASTER_DEMO_ADMIN_PASSWORD;
if (Boolean(adminEmail) !== Boolean(adminPassword)) throw new Error("Set both ASTER_DEMO_ADMIN_EMAIL and ASTER_DEMO_ADMIN_PASSWORD to create a local demonstration administrator.");
if (mode === "memory") {
  loadDemoData();
  if (adminEmail && adminPassword) {
    if (process.env.NODE_ENV === "production") throw new Error("Demonstration administrator bootstrap is disabled in production.");
    if (adminPassword.length < 12) throw new Error("ASTER_DEMO_ADMIN_PASSWORD must contain at least 12 characters.");
    const admin: User = {
      id: crypto.randomUUID(), name: "Aster Demo Administrator", email: adminEmail,
      passwordHash: bcrypt.hashSync(adminPassword, 12), role: "admin", bio: "Local demonstration administrator.",
      avatar: "AD", createdAt: new Date().toISOString()
    };
    void repository.createDemoAdmin(admin);
  }
}

export async function initializeApplicationData(): Promise<void> {
  if (mode === "memory") return;
  await repository.initialize();
  if (process.env.SEED_DEMO_DATA === "true") {
    const data = createDemoData();
    await repository.seedDemoData(data.users, data.courses, data.assessments);
  }
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("ASTER_DEMO_ADMIN_PASSWORD must contain at least 12 characters.");
    await repository.ensureDemoAdmin({
      id: crypto.randomUUID(), name: "Aster Demo Administrator", email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12), role: "admin", bio: "Configured platform administrator.",
      avatar: "AD", createdAt: new Date().toISOString()
    });
  }
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};
const safeUser = (user: User) => ({
  id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar
});
const tokenFor = (user: User) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "2h" });
const asyncRoute = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { void handler(req, res, next).catch(next); };

const requireAuth = asyncRoute(async (req, _res, next) => {
  const token = req.cookies.aster_session as string | undefined;
  if (!token) throw new HttpError(401, "Please sign in to continue.");
  let payload: jwt.JwtPayload;
  try { payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload; }
  catch { throw new HttpError(401, "Your session is invalid or expired."); }
  const user = await repository.findUserById(String(payload.sub ?? ""));
  if (!user) throw new HttpError(401, "Your session is no longer valid.");
  req.currentUser = user;
  next();
});

const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!roleAllowed(req.currentUser, roles)) return next(new HttpError(403, "You do not have permission to perform this action."));
  next();
};

const validateBody = (schema: z.ZodType) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};
const routeParam = (req: Request, key: string): string => {
  const value = req.params[key];
  if (typeof value !== "string" || !value) throw new HttpError(400, "Invalid route parameter.");
  return value;
};

app.use((req, _res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin && req.headers.origin !== frontendUrl) {
    return next(new HttpError(403, "Request origin is not allowed."));
  }
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(10).max(128),
  role: z.enum(["student", "instructor"]).default("student")
});
const loginSchema = z.object({ email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(1).max(128) });

app.get("/api/health", (_req, res) => {
  const health = databaseHealth();
  const ready = health.status === "ready";
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    database: health.mode === "memory" ? "development-memory" : ready ? "mongodb-connected" : "mongodb-disconnected",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/auth/register", authLimiter, validateBody(registerSchema), asyncRoute(async (req, res) => {
  const { name, email, password, role } = req.body as z.infer<typeof registerSchema>;
  if (await repository.findUserByEmail(email)) throw new HttpError(409, "An account with this email already exists.");
  const user: User = {
    id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 12),
    role, bio: "", avatar: name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    createdAt: new Date().toISOString()
  };
  await repository.createUser(user);
  res.cookie("aster_session", tokenFor(user), cookieOptions);
  res.json({ user: safeUser(user) });
}));

app.post("/api/auth/login", authLimiter, validateBody(loginSchema), asyncRoute(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await repository.findUserByEmail(email);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, "Email or password is incorrect.");
  res.cookie("aster_session", tokenFor(user), cookieOptions);
  res.json({ user: safeUser(user) });
}));

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: safeUser(req.currentUser!) }));
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("aster_session", cookieOptions);
  res.status(204).end();
});
app.post("/api/auth/forgot-password", authLimiter, validateBody(z.object({ email: z.string().email().transform(value => value.toLowerCase()) })), asyncRoute(async (req, res) => {
  const user = await repository.findUserByEmail(req.body.email);
  const response: { message: string; developmentResetToken?: string } = { message: "If an account exists for that email, password recovery instructions are on their way." };
  if (user && process.env.NODE_ENV !== "production") {
    const token = crypto.randomBytes(32).toString("hex");
    if (mode === "mongodb") await repository.saveResetToken(user.id, crypto.createHash("sha256").update(token).digest("hex"), new Date(Date.now() + 15 * 60 * 1000));
    else passwordResetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 15 * 60 * 1000 });
    response.developmentResetToken = token;
  }
  res.json(response);
}));
app.post("/api/auth/reset-password", authLimiter, validateBody(z.object({ token: z.string().min(32).max(128), password: z.string().min(10).max(128) })), asyncRoute(async (req, res) => {
  let userId: string | undefined;
  if (mode === "mongodb") {
    userId = await repository.consumeResetToken(crypto.createHash("sha256").update(req.body.token).digest("hex"));
  } else {
    const entry = passwordResetTokens.get(req.body.token);
    if (entry && entry.expiresAt >= Date.now()) userId = entry.userId;
    passwordResetTokens.delete(req.body.token);
  }
  if (!userId) throw new HttpError(400, "This reset link is invalid or expired. Request a new one.");
  const updated = await repository.updateUser(userId, { passwordHash: await bcrypt.hash(req.body.password, 12) });
  if (!updated) throw new HttpError(400, "This reset link is invalid or expired. Request a new one.");
  res.json({ message: "Your password has been updated. You can now sign in." });
}));
app.patch("/api/users/me", requireAuth, validateBody(z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional()
}).refine(value => Object.keys(value).length > 0, "Update at least one profile field.")), asyncRoute(async (req, res) => {
  const user = await repository.updateUser(req.currentUser!.id, req.body);
  if (!user) throw new HttpError(404, "Account not found.");
  res.json({ user: safeUser(user) });
}));

app.post("/api/contact", validateBody(z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(3000)
})), asyncRoute(async (req, res) => {
  if (mode === "mongodb") await repository.saveContactMessage(req.body);
  else contactMessages.push({ ...req.body, createdAt: new Date().toISOString() });
  res.status(201).json({ message: "Thanks for getting in touch. Your message has been received." });
}));

app.get("/api/courses", asyncRoute(async (req, res) => {
  const query = z.string().catch("").parse(req.query.q).trim().toLowerCase();
  const category = z.string().catch("").parse(req.query.category);
  const level = z.string().catch("").parse(req.query.level);
  const sort = z.enum(["popular", "title", "newest"]).catch("popular").parse(req.query.sort);
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(String(req.query.limit ?? "9"), 10) || 9));
  const { courses, total } = await repository.listPublishedCourses({ query, category, level, sort, page, limit });
  res.json({ courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
app.get("/api/categories", asyncRoute(async (_req, res) => res.json({ categories: await repository.listCategories() })));
app.get("/api/courses/:slug", asyncRoute(async (req, res) => {
  const course = await repository.findPublishedCourseBySlug(routeParam(req, "slug"));
  if (!course) throw new HttpError(404, "Course not found.");
  const instructor = await repository.findUserById(course.instructorId);
  res.json({ course, instructor: instructor ? { name: instructor.name, bio: instructor.bio, avatar: instructor.avatar } : null });
}));

app.post("/api/courses/:courseId/enroll", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  const course = await repository.findCourseById(routeParam(req, "courseId"));
  if (!course || course.status !== "published") throw new HttpError(404, "Published course not found.");
  const enrollment = await repository.findOrCreateEnrollment(req.currentUser!.id, course.id);
  res.status(201).json({ enrollment });
}));
app.get("/api/student/enrollments", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  const enrollments = await repository.listStudentEnrollments(req.currentUser!.id);
  const items = await Promise.all(enrollments.map(async enrollment => {
    const course = await repository.findCourseById(enrollment.courseId);
    return course ? { enrollment, course, progress: progressPercent(course, enrollment) } : null;
  }));
  res.json({ enrollments: items.filter((item): item is NonNullable<typeof item> => item !== null) });
}));

app.post("/api/student/courses/:courseId/lessons/:lessonId/complete", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  const courseId = routeParam(req, "courseId");
  const lessonId = routeParam(req, "lessonId");
  const course = await repository.findCourseById(courseId);
  if (!course || course.status !== "published" || !await repository.findEnrollment(req.currentUser!.id, courseId)) throw new HttpError(403, "Enroll in this course before accessing its lessons.");
  if (!lessonIds(course).includes(lessonId)) throw new HttpError(404, "Lesson not found.");
  const enrollment = await repository.completeLesson(req.currentUser!.id, courseId, lessonId);
  if (!enrollment) throw new HttpError(403, "Enroll in this course before accessing its lessons.");
  const progress = progressPercent(course, enrollment);
  let certificate = await repository.findCertificate(req.currentUser!.id, course.id);
  if (canIssueCertificate(course, enrollment) && !certificate) {
    const candidate: Certificate = { id: `AST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, userId: req.currentUser!.id, courseId: course.id, issuedAt: new Date().toISOString() };
    certificate = await repository.createCertificate(candidate);
  }
  res.json({ progress, enrollment, certificate: certificate ?? null });
}));

app.get("/api/student/courses/:courseId/assessments", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  const courseId = routeParam(req, "courseId");
  const course = await repository.findCourseById(courseId);
  if (!course || course.status !== "published") throw new HttpError(404, "Course not found.");
  if (!await repository.findEnrollment(req.currentUser!.id, courseId)) throw new HttpError(403, "Enroll in this course to access assessments.");
  const assessments = (await repository.listAssessments(courseId)).map(({ id, title, passingScore, questions }) => ({
    id, title, passingScore, questions: questions.map(({ id: questionId, prompt, options }) => ({ id: questionId, prompt, options }))
  }));
  res.json({ assessments });
}));
app.post("/api/student/assessments/:assessmentId/submit", requireAuth, requireRole("student"), validateBody(z.object({ answers: z.record(z.string(), z.number().int().min(0)) })), asyncRoute(async (req, res) => {
  const assessment = await repository.findAssessment(routeParam(req, "assessmentId"));
  if (!assessment) throw new HttpError(404, "Assessment not found.");
  const course = await repository.findCourseById(assessment.courseId);
  if (!course || course.status !== "published") throw new HttpError(404, "Course not found.");
  if (!await repository.findEnrollment(req.currentUser!.id, assessment.courseId)) throw new HttpError(403, "Enroll in this course to submit this assessment.");
  const { score, passed, totalQuestions } = gradeAssessment(assessment, req.body.answers as Record<string, number>);
  const attempt = { id: crypto.randomUUID(), assessmentId: assessment.id, userId: req.currentUser!.id, score, passed, submittedAt: new Date().toISOString() };
  await repository.createAttempt(attempt);
  res.status(201).json({ attempt, totalQuestions });
}));
app.get("/api/student/attempts", requireAuth, requireRole("student"), asyncRoute(async (req, res) => res.json({ attempts: await repository.listAttempts(req.currentUser!.id) })));
app.get("/api/student/certificates", requireAuth, requireRole("student"), asyncRoute(async (req, res) => res.json({ certificates: await repository.listCertificates(req.currentUser!.id) })));
app.get("/api/certificates/verify/:certificateId", asyncRoute(async (req, res) => {
  const certificate = await repository.findCertificateById(routeParam(req, "certificateId"));
  if (!certificate) { res.json({ valid: false }); return; }
  const [course, learner] = await Promise.all([repository.findCourseById(certificate.courseId), repository.findUserById(certificate.userId)]);
  res.json({ valid: true, certificateId: certificate.id, courseTitle: course?.title, learner: learner?.name, issuedAt: certificate.issuedAt });
}));
app.get("/api/student/bookmarks", requireAuth, requireRole("student"), asyncRoute(async (req, res) => res.json({ courses: await repository.listBookmarks(req.currentUser!.id) })));
app.post("/api/student/bookmarks/:courseId", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  const courseId = routeParam(req, "courseId");
  const course = await repository.findCourseById(courseId);
  if (!course || course.status !== "published") throw new HttpError(404, "Course not found.");
  await repository.addBookmark(req.currentUser!.id, courseId);
  res.status(204).end();
}));
app.delete("/api/student/bookmarks/:courseId", requireAuth, requireRole("student"), asyncRoute(async (req, res) => {
  await repository.removeBookmark(req.currentUser!.id, routeParam(req, "courseId"));
  res.status(204).end();
}));

const courseInput = z.object({
  title: z.string().trim().min(3).max(120),
  subtitle: z.string().trim().min(5).max(180),
  description: z.string().trim().min(20).max(5000),
  category: z.string().trim().min(2).max(60),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().trim().max(40),
  outcomes: z.array(z.string().trim().min(3).max(180)).max(10).default([]),
  prerequisites: z.array(z.string().trim().min(3).max(180)).max(10).default([])
});
app.get("/api/instructor/courses", requireAuth, requireRole("instructor", "admin"), asyncRoute(async (req, res) => {
  res.json({ courses: await repository.listInstructorCourses(req.currentUser!.id, req.currentUser!.role === "admin") });
}));
app.post("/api/instructor/courses", requireAuth, requireRole("instructor"), validateBody(courseInput), asyncRoute(async (req, res) => {
  const input = req.body as z.infer<typeof courseInput>;
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const course: Course = {
    ...input, id: crypto.randomUUID(), slug: `${slug}-${crypto.randomUUID().slice(0, 5)}`, image: "",
    instructorId: req.currentUser!.id, instructorName: req.currentUser!.name,
    status: "draft", modules: [], createdAt: new Date().toISOString()
  };
  await repository.createCourse(course);
  res.status(201).json({ course });
}));
app.patch("/api/instructor/courses/:courseId", requireAuth, requireRole("instructor", "admin"), validateBody(courseInput.partial().extend({
  status: z.enum(["draft", "pending", "published", "rejected", "archived"]).optional()
}).refine(value => Object.keys(value).length > 0, "Update at least one course field.")), asyncRoute(async (req, res) => {
  const course = await repository.findCourseById(routeParam(req, "courseId"));
  if (!course) throw new HttpError(404, "Course not found.");
  if (!canManageCourse(req.currentUser!, course)) throw new HttpError(403, "You can only update courses you own.");
  if (req.currentUser!.role === "instructor" && req.body.status && req.body.status !== "draft") throw new HttpError(403, "Submit your course for administrator review before publication.");
  const updated = await repository.updateCourse(course.id, req.body);
  if (!updated) throw new HttpError(404, "Course not found.");
  res.json({ course: updated });
}));
app.post("/api/instructor/courses/:courseId/submit", requireAuth, requireRole("instructor"), asyncRoute(async (req, res) => {
  const courseId = routeParam(req, "courseId");
  const course = await repository.findCourseById(courseId);
  if (!course || course.instructorId !== req.currentUser!.id) throw new HttpError(404, "Course not found.");
  if (course.status !== "draft") throw new HttpError(409, "Only draft courses can be submitted for review.");
  const updated = await repository.updateCourse(courseId, { status: "pending" });
  if (!updated) throw new HttpError(404, "Course not found.");
  res.json({ course: updated });
}));
const assessmentInput = z.object({
  title: z.string().trim().min(3).max(120),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z.array(z.object({
    prompt: z.string().trim().min(5).max(500),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
    correctIndex: z.number().int().min(0)
  }).superRefine((question, context) => {
    if (question.correctIndex >= question.options.length) context.addIssue({ code: "custom", message: "Correct answer must match one of the answer options.", path: ["correctIndex"] });
  })).min(1).max(30)
});
app.get("/api/instructor/courses/:courseId/assessments", requireAuth, requireRole("instructor", "admin"), asyncRoute(async (req, res) => {
  const course = await repository.findCourseById(routeParam(req, "courseId"));
  if (!course) throw new HttpError(404, "Course not found.");
  if (!canManageCourse(req.currentUser!, course)) throw new HttpError(403, "You can only manage assessments for courses you own.");
  res.json({ assessments: await repository.listAssessments(course.id) });
}));
app.post("/api/instructor/courses/:courseId/assessments", requireAuth, requireRole("instructor"), validateBody(assessmentInput), asyncRoute(async (req, res) => {
  const courseId = routeParam(req, "courseId");
  const course = await repository.findCourseById(courseId);
  if (!course) throw new HttpError(404, "Course not found.");
  if (!canManageCourse(req.currentUser!, course)) throw new HttpError(403, "You can only manage assessments for courses you own.");
  const input = req.body as z.infer<typeof assessmentInput>;
  const assessment = {
    ...input, id: crypto.randomUUID(), courseId,
    questions: input.questions.map(question => ({ ...question, id: crypto.randomUUID() }))
  };
  await repository.createAssessment(assessment);
  res.status(201).json({ assessment });
}));
app.get("/api/instructor/analytics", requireAuth, requireRole("instructor", "admin"), asyncRoute(async (req, res) => {
  res.json(await repository.getInstructorAnalytics(req.currentUser!.id, req.currentUser!.role === "admin"));
}));

app.get("/api/admin/overview", requireAuth, requireRole("admin"), asyncRoute(async (_req, res) => res.json(await repository.getCounts())));
app.get("/api/admin/users", requireAuth, requireRole("admin"), asyncRoute(async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  res.json({ users: (await repository.listUsers(q)).map(safeUser) });
}));
app.get("/api/admin/courses", requireAuth, requireRole("admin"), asyncRoute(async (_req, res) => res.json({ courses: await repository.listCourses() })));
app.patch("/api/admin/courses/:courseId/moderate", requireAuth, requireRole("admin"), validateBody(z.object({ status: z.enum(["published", "rejected", "archived"]) })), asyncRoute(async (req, res) => {
  const course = await repository.updateCourse(routeParam(req, "courseId"), { status: req.body.status });
  if (!course) throw new HttpError(404, "Course not found.");
  res.json({ course });
}));
app.get("/api/admin/enrollments", requireAuth, requireRole("admin"), asyncRoute(async (_req, res) => res.json({ enrollments: await repository.listAdminEnrollments() })));

app.use((_req, _res, next) => next(new HttpError(404, "The requested resource was not found.")));
app.use((error: Error & { code?: number; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: { message: "Please check the submitted information.", details: error.issues.map(issue => ({ path: issue.path, message: issue.message })) } });
  if (error.code === 11000) return res.status(409).json({ error: { message: "A record with that value already exists." } });
  if (error instanceof HttpError) return res.status(error.status).json({ error: { message: error.message } });
  if (typeof error.status === "number" && error.status >= 400 && error.status < 500) {
    const message = error.status === 413 ? "The request body is too large." : "The request could not be processed.";
    return res.status(error.status).json({ error: { message } });
  }
  if (mongoose.connection.readyState !== 1 && mode === "mongodb") return res.status(503).json({ error: { message: "The database is temporarily unavailable. Please try again." } });
  console.error(JSON.stringify({ level: "error", message: error.message, timestamp: new Date().toISOString() }));
  res.status(500).json({ error: { message: "An unexpected server error occurred." } });
});

export default app;
