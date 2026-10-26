import crypto from "node:crypto";
import type { SortOrder } from "mongoose";
import { databaseMode } from "../config/database";
import {
  AssessmentModel, BookmarkModel, CategoryModel, CertificateModel, ContactMessageModel, CourseModel,
  EnrollmentModel, PasswordResetModel, QuizAttemptModel, UserModel
} from "../models";
import type { Assessment, Certificate, Course, Enrollment, QuizAttempt, User } from "../types/domain";
import { store, enrollmentKey } from "./store";

type MongoRecord = Record<string, unknown> & { _id?: unknown; createdAt?: Date | string; updatedAt?: Date | string };

function asDomain<T>(record: MongoRecord): T {
  const { _id, __v: _version, ...properties } = record;
  const output: Record<string, unknown> = { ...properties, id: String(_id) };
  if (record.createdAt instanceof Date) output.createdAt = record.createdAt.toISOString();
  if (record.updatedAt instanceof Date) output.updatedAt = record.updatedAt.toISOString();
  if (record.enrolledAt instanceof Date) output.enrolledAt = record.enrolledAt.toISOString();
  if (record.issuedAt instanceof Date) output.issuedAt = record.issuedAt.toISOString();
  if (record.submittedAt instanceof Date) output.submittedAt = record.submittedAt.toISOString();
  return output as T;
}

const docRecord = <T>(doc: { toObject(): MongoRecord } | null): T | null => doc ? asDomain<T>(doc.toObject()) : null;
const isMongo = () => databaseMode() === "mongodb";

export const repository = {
  async initialize(): Promise<void> {
    if (!isMongo()) return;
    await Promise.all([
      UserModel.init(), CourseModel.init(), EnrollmentModel.init(), AssessmentModel.init(),
      QuizAttemptModel.init(), CertificateModel.init(), BookmarkModel.init(),
      CategoryModel.init(), PasswordResetModel.init(), ContactMessageModel.init()
    ]);
  },

  async findUserById(id: string): Promise<User | undefined> {
    if (!isMongo()) return store.users.find(user => user.id === id);
    const doc = await UserModel.findById(id).select("+passwordHash").lean();
    return doc ? asDomain<User>(doc as MongoRecord) : undefined;
  },
  async findUserByEmail(email: string): Promise<User | undefined> {
    if (!isMongo()) return store.users.find(user => user.email === email);
    const doc = await UserModel.findOne({ email }).select("+passwordHash").lean();
    return doc ? asDomain<User>(doc as MongoRecord) : undefined;
  },
  async listUsers(query = ""): Promise<User[]> {
    if (!isMongo()) return store.users.filter(user => user.name.toLowerCase().includes(query) || user.email.includes(query));
    const filter = query ? { $or: [{ name: { $regex: escapeRegex(query), $options: "i" } }, { email: { $regex: escapeRegex(query), $options: "i" } }] } : {};
    const docs = await UserModel.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map(user => asDomain<User>(user as MongoRecord));
  },
  async createUser(user: User): Promise<User> {
    if (!isMongo()) { store.users.push(user); return user; }
    const doc = await UserModel.create({ ...user, _id: user.id });
    return asDomain<User>(doc.toObject() as MongoRecord);
  },
  async updateUser(id: string, changes: Partial<Pick<User, "name" | "bio" | "passwordHash">>): Promise<User | undefined> {
    if (!isMongo()) {
      const user = store.users.find(entry => entry.id === id);
      if (user) Object.assign(user, changes);
      return user;
    }
    const doc = await UserModel.findByIdAndUpdate(id, { $set: changes }, { new: true }).select("+passwordHash");
    return docRecord<User>(doc) ?? undefined;
  },
  async createDemoAdmin(user: User): Promise<void> {
    if (!isMongo()) {
      if (!store.users.some(entry => entry.email === user.email)) store.users.push(user);
      return;
    }
    await UserModel.updateOne({ email: user.email }, { $setOnInsert: { ...user, _id: user.id } }, { upsert: true, runValidators: true });
  },

  async listCourses(): Promise<Course[]> {
    if (!isMongo()) return [...store.courses];
    const docs = await CourseModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(course => asDomain<Course>(course as MongoRecord));
  },
  async listPublishedCourses(options: { query: string; category: string; level: string; sort: string; page: number; limit: number }): Promise<{ courses: Course[]; total: number }> {
    if (!isMongo()) {
      let courses = store.courses.filter(course => course.status === "published");
      if (options.query) courses = courses.filter(course => `${course.title} ${course.description} ${course.category} ${course.instructorName}`.toLowerCase().includes(options.query));
      if (options.category) courses = courses.filter(course => course.category === options.category);
      if (options.level) courses = courses.filter(course => course.level === options.level);
      if (options.sort === "title") courses.sort((a, b) => a.title.localeCompare(b.title));
      if (options.sort === "newest") courses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const total = courses.length;
      return { courses: courses.slice((options.page - 1) * options.limit, options.page * options.limit), total };
    }
    const filter: Record<string, unknown> = { status: "published" };
    if (options.query) {
      const term = { $regex: escapeRegex(options.query), $options: "i" };
      filter.$or = [{ title: term }, { description: term }, { category: term }, { instructorName: term }];
    }
    if (options.category) filter.category = options.category;
    if (options.level) filter.level = options.level;
    const sort: Record<string, SortOrder> = options.sort === "newest" ? { createdAt: -1 } : { title: 1 };
    const [docs, total] = await Promise.all([
      CourseModel.find(filter).sort(sort).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
      CourseModel.countDocuments(filter)
    ]);
    return { courses: docs.map(course => asDomain<Course>(course as MongoRecord)), total };
  },
  async listCategories(): Promise<string[]> {
    if (!isMongo()) return [...new Set(store.courses.filter(course => course.status === "published").map(course => course.category))];
    return CourseModel.distinct("category", { status: "published" });
  },
  async findPublishedCourseBySlug(slug: string): Promise<Course | undefined> {
    if (!isMongo()) return store.courses.find(course => course.slug === slug && course.status === "published");
    const doc = await CourseModel.findOne({ slug, status: "published" }).lean();
    return doc ? asDomain<Course>(doc as MongoRecord) : undefined;
  },
  async findCourseById(id: string): Promise<Course | undefined> {
    if (!isMongo()) return store.courses.find(course => course.id === id);
    const doc = await CourseModel.findById(id).lean();
    return doc ? asDomain<Course>(doc as MongoRecord) : undefined;
  },
  async listInstructorCourses(instructorId: string, isAdmin: boolean): Promise<Course[]> {
    if (!isMongo()) return store.courses.filter(course => isAdmin || course.instructorId === instructorId);
    const docs = await CourseModel.find(isAdmin ? {} : { instructorId }).sort({ createdAt: -1 }).lean();
    return docs.map(course => asDomain<Course>(course as MongoRecord));
  },
  async createCourse(course: Course): Promise<Course> {
    if (!isMongo()) { store.courses.push(course); return course; }
    const doc = await CourseModel.create({ ...course, _id: course.id });
    return asDomain<Course>(doc.toObject() as MongoRecord);
  },
  async updateCourse(id: string, changes: Partial<Course>): Promise<Course | undefined> {
    if (!isMongo()) {
      const course = store.courses.find(entry => entry.id === id);
      if (course) Object.assign(course, changes);
      return course;
    }
    const doc = await CourseModel.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }).lean();
    return doc ? asDomain<Course>(doc as MongoRecord) : undefined;
  },
  async findOrCreateEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    if (!isMongo()) {
      let entry = store.enrollments.find(item => item.userId === userId && item.courseId === courseId);
      if (!entry) {
        entry = { id: crypto.randomUUID(), userId, courseId, completedLessonIds: [], enrolledAt: new Date().toISOString() };
        store.enrollments.push(entry);
      }
      return entry;
    }
    const id = crypto.randomUUID();
    let doc;
    try {
      doc = await EnrollmentModel.findOneAndUpdate(
        { userId, courseId },
        { $setOnInsert: { _id: id, userId, courseId, completedLessonIds: [], enrolledAt: new Date() } },
        { upsert: true, new: true, runValidators: true }
      ).lean();
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      doc = await EnrollmentModel.findOne({ userId, courseId }).lean();
    }
    if (!doc) throw new Error("Could not create or retrieve enrollment.");
    return asDomain<Enrollment>(doc as MongoRecord);
  },
  async findEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    if (!isMongo()) return store.enrollments.find(entry => entry.userId === userId && entry.courseId === courseId);
    const doc = await EnrollmentModel.findOne({ userId, courseId }).lean();
    return doc ? asDomain<Enrollment>(doc as MongoRecord) : undefined;
  },
  async listStudentEnrollments(userId: string): Promise<Enrollment[]> {
    if (!isMongo()) return store.enrollments.filter(entry => entry.userId === userId);
    const docs = await EnrollmentModel.find({ userId }).sort({ enrolledAt: -1 }).lean();
    return docs.map(enrollment => asDomain<Enrollment>(enrollment as MongoRecord));
  },
  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
    if (!isMongo()) {
      const entry = store.enrollments.find(item => item.userId === userId && item.courseId === courseId);
      if (entry) {
        if (!entry.completedLessonIds.includes(lessonId)) entry.completedLessonIds.push(lessonId);
        entry.lastLessonId = lessonId;
      }
      return entry;
    }
    const doc = await EnrollmentModel.findOneAndUpdate(
      { userId, courseId },
      { $addToSet: { completedLessonIds: lessonId }, $set: { lastLessonId: lessonId } },
      { new: true, runValidators: true }
    ).lean();
    return doc ? asDomain<Enrollment>(doc as MongoRecord) : undefined;
  },
  async listAssessments(courseId: string): Promise<Assessment[]> {
    if (!isMongo()) return store.assessments.filter(entry => entry.courseId === courseId);
    const docs = await AssessmentModel.find({ courseId }).lean();
    return docs.map(assessment => asDomain<Assessment>(assessment as MongoRecord));
  },
  async findAssessment(id: string): Promise<Assessment | undefined> {
    if (!isMongo()) return store.assessments.find(entry => entry.id === id);
    const doc = await AssessmentModel.findById(id).lean();
    return doc ? asDomain<Assessment>(doc as MongoRecord) : undefined;
  },
  async createAssessment(assessment: Assessment): Promise<Assessment> {
    if (!isMongo()) { store.assessments.push(assessment); return assessment; }
    const doc = await AssessmentModel.create({ ...assessment, _id: assessment.id });
    return asDomain<Assessment>(doc.toObject() as MongoRecord);
  },
  async createAttempt(attempt: QuizAttempt): Promise<void> {
    if (!isMongo()) { store.attempts.push(attempt); return; }
    await QuizAttemptModel.create({ ...attempt, _id: attempt.id });
  },
  async listAttempts(userId: string): Promise<QuizAttempt[]> {
    if (!isMongo()) return store.attempts.filter(attempt => attempt.userId === userId);
    const docs = await QuizAttemptModel.find({ userId }).sort({ submittedAt: -1 }).lean();
    return docs.map(attempt => asDomain<QuizAttempt>(attempt as MongoRecord));
  },
  async findCertificate(userId: string, courseId: string): Promise<Certificate | undefined> {
    if (!isMongo()) return store.certificates.find(certificate => certificate.userId === userId && certificate.courseId === courseId);
    const doc = await CertificateModel.findOne({ userId, courseId }).lean();
    return doc ? asDomain<Certificate>(doc as MongoRecord) : undefined;
  },
  async createCertificate(certificate: Certificate): Promise<Certificate> {
    if (!isMongo()) { store.certificates.push(certificate); return certificate; }
    let doc;
    try {
      doc = await CertificateModel.findOneAndUpdate(
        { userId: certificate.userId, courseId: certificate.courseId },
        { $setOnInsert: { ...certificate, _id: certificate.id, certificateId: certificate.id } },
        { upsert: true, new: true, runValidators: true }
      ).lean();
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      doc = await CertificateModel.findOne({ userId: certificate.userId, courseId: certificate.courseId }).lean();
    }
    if (!doc) throw new Error("Could not create or retrieve certificate.");
    return asDomain<Certificate>(doc as MongoRecord);
  },
  async listCertificates(userId: string): Promise<Array<Certificate & { courseTitle: string }>> {
    if (!isMongo()) return store.certificates.filter(certificate => certificate.userId === userId).map(certificate => ({
      ...certificate, courseTitle: store.courses.find(course => course.id === certificate.courseId)?.title ?? "Course"
    }));
    const docs = await CertificateModel.find({ userId }).sort({ issuedAt: -1 }).lean();
    return Promise.all(docs.map(async doc => {
      const certificate = asDomain<Certificate>(doc as MongoRecord);
      const course = await CourseModel.findOne({ _id: certificate.courseId }).select("title").lean() as { title?: string } | null;
      return { ...certificate, courseTitle: course?.title ?? "Course" };
    }));
  },
  async findCertificateById(id: string): Promise<Certificate | undefined> {
    if (!isMongo()) return store.certificates.find(certificate => certificate.id === id);
    const doc = await CertificateModel.findOne({ $or: [{ _id: id }, { certificateId: id }] }).lean();
    return doc ? asDomain<Certificate>(doc as MongoRecord) : undefined;
  },
  async addBookmark(userId: string, courseId: string): Promise<void> {
    if (!isMongo()) { store.bookmarks.add(enrollmentKey(userId, courseId)); return; }
    await BookmarkModel.updateOne({ userId, courseId }, { $setOnInsert: { _id: enrollmentKey(userId, courseId), userId, courseId } }, { upsert: true });
  },
  async removeBookmark(userId: string, courseId: string): Promise<void> {
    if (!isMongo()) { store.bookmarks.delete(enrollmentKey(userId, courseId)); return; }
    await BookmarkModel.deleteOne({ userId, courseId });
  },
  async listBookmarks(userId: string): Promise<Course[]> {
    if (!isMongo()) {
      const ids = [...store.bookmarks].filter(key => key.startsWith(`${userId}:`)).map(key => key.slice(userId.length + 1));
      return store.courses.filter(course => ids.includes(course.id) && course.status === "published");
    }
    const bookmarks = await BookmarkModel.find({ userId }).lean();
    const ids = bookmarks.map(bookmark => bookmark.courseId);
    const courses = await CourseModel.find({ _id: { $in: ids }, status: "published" }).lean();
    return courses.map(course => asDomain<Course>(course as MongoRecord));
  },
  async saveResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (!isMongo()) return;
    await PasswordResetModel.create({ _id: crypto.randomUUID(), userId, tokenHash, expiresAt });
  },
  async consumeResetToken(tokenHash: string): Promise<string | undefined> {
    if (!isMongo()) return undefined;
    const doc = await PasswordResetModel.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } }).lean() as { userId?: string } | null;
    return doc?.userId;
  },
  async saveContactMessage(message: { name: string; email: string; message: string }): Promise<void> {
    if (isMongo()) await ContactMessageModel.create({ ...message, _id: crypto.randomUUID() });
  },
  async ensureDemoAdmin(user: User): Promise<void> {
    await this.createDemoAdmin(user);
  },
  async seedDemoData(users: User[], courses: Course[], assessments: Assessment[]): Promise<void> {
    if (!isMongo()) return;
    for (const user of users) {
      await UserModel.updateOne({ _id: user.id }, { $setOnInsert: { ...user, _id: user.id } }, { upsert: true, runValidators: true });
    }
    for (const course of courses) {
      await CourseModel.updateOne({ _id: course.id }, { $setOnInsert: { ...course, _id: course.id } }, { upsert: true, runValidators: true });
    }
    for (const name of new Set(courses.map(course => course.category))) {
      await CategoryModel.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true, runValidators: true });
    }
    for (const assessment of assessments) {
      await AssessmentModel.updateOne({ _id: assessment.id }, { $setOnInsert: { ...assessment, _id: assessment.id } }, { upsert: true, runValidators: true });
    }
  },
  async getCounts(): Promise<{ users: number; students: number; instructors: number; courses: number; pendingCourses: number; enrollments: number; assessments: number }> {
    if (!isMongo()) return {
      users: store.users.length, students: store.users.filter(user => user.role === "student").length,
      instructors: store.users.filter(user => user.role === "instructor").length, courses: store.courses.length,
      pendingCourses: store.courses.filter(course => course.status === "pending").length,
      enrollments: store.enrollments.length, assessments: store.assessments.length
    };
    const [users, students, instructors, courses, pendingCourses, enrollments, assessments] = await Promise.all([
      UserModel.countDocuments(), UserModel.countDocuments({ role: "student" }), UserModel.countDocuments({ role: "instructor" }),
      CourseModel.countDocuments(), CourseModel.countDocuments({ status: "pending" }), EnrollmentModel.countDocuments(), AssessmentModel.countDocuments()
    ]);
    return { users, students, instructors, courses, pendingCourses, enrollments, assessments };
  },
  async getInstructorAnalytics(instructorId: string, isAdmin: boolean): Promise<{ courses: number; enrollments: number; completions: number }> {
    const courses = await this.listInstructorCourses(instructorId, isAdmin);
    const courseIds = new Set(courses.map(course => course.id));
    const enrollments = isMongo()
      ? (await EnrollmentModel.find({ courseId: { $in: [...courseIds] } }).lean()).map(item => asDomain<Enrollment>(item as MongoRecord))
      : store.enrollments.filter(entry => courseIds.has(entry.courseId));
    const { progressPercent } = await import("../services/progress");
    return { courses: courses.length, enrollments: enrollments.length, completions: enrollments.filter(enrollment => {
      const course = courses.find(entry => entry.id === enrollment.courseId);
      return course && progressPercent(course, enrollment) === 100;
    }).length };
  },
  async listAdminEnrollments(): Promise<Array<Enrollment & { student: ReturnType<typeof publicUser>; courseTitle: string | undefined }>> {
    const enrollments = isMongo()
      ? (await EnrollmentModel.find().sort({ enrolledAt: -1 }).lean()).map(item => asDomain<Enrollment>(item as MongoRecord))
      : store.enrollments;
    return Promise.all(enrollments.map(async enrollment => {
      const [student, course] = await Promise.all([
        this.findUserById(enrollment.userId),
        this.findCourseById(enrollment.courseId)
      ]);
      return { ...enrollment, student: student ? publicUser(student) : undefined, courseTitle: course?.title } as Enrollment & { student: ReturnType<typeof publicUser>; courseTitle: string | undefined };
    }));
  }
};

function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio, avatar: user.avatar };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
