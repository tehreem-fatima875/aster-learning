import crypto from "node:crypto";
import type { Assessment, Course, Enrollment, Role, User } from "../types/domain";
import { HttpError } from "../utils/errors";
import type { Store } from "../data/store";
import { enrollmentKey } from "../data/store";
import { progressPercent } from "./progress";

export function roleAllowed(user: User | undefined, allowed: Role[]): boolean {
  return Boolean(user && allowed.includes(user.role));
}

export function canManageCourse(user: User, course: Course): boolean {
  return user.role === "admin" || (user.role === "instructor" && course.instructorId === user.id);
}

export function canViewCourse(course: Course, user?: User): boolean {
  return course.status === "published" || Boolean(user && (user.role === "admin" || (user.role === "instructor" && course.instructorId === user.id)));
}

export function findOrCreateEnrollment(store: Store, userId: string, courseId: string): Enrollment {
  const existing = store.enrollments.find(item => enrollmentKey(item.userId, item.courseId) === enrollmentKey(userId, courseId));
  if (existing) return existing;
  const enrollment: Enrollment = { id: crypto.randomUUID(), userId, courseId, completedLessonIds: [], enrolledAt: new Date().toISOString() };
  store.enrollments.push(enrollment);
  return enrollment;
}

export function gradeAssessment(assessment: Assessment, answers: Record<string, number>): { score: number; passed: boolean; totalQuestions: number } {
  const questions = assessment.questions;
  if (!questions.length || Object.keys(answers).length !== questions.length || questions.some(question =>
    !Object.prototype.hasOwnProperty.call(answers, question.id) || !Number.isInteger(answers[question.id]) ||
    answers[question.id] < 0 || answers[question.id] >= question.options.length
  )) {
    throw new HttpError(400, "Submit one valid answer for every question.");
  }
  const correct = questions.filter(question => answers[question.id] === question.correctIndex).length;
  const score = Math.round(correct / questions.length * 100);
  return { score, passed: score >= assessment.passingScore, totalQuestions: questions.length };
}

export function canIssueCertificate(course: Course, enrollment: Enrollment): boolean {
  return progressPercent(course, enrollment) === 100 && course.modules.some(module => module.lessons.length > 0);
}
