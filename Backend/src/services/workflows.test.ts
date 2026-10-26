import assert from "node:assert/strict";
import { test } from "node:test";
import { store } from "../data/store";
import type { Assessment, Course, Enrollment, User } from "../types/domain";
import { canIssueCertificate, canManageCourse, canViewCourse, findOrCreateEnrollment, gradeAssessment, roleAllowed } from "./workflows";

const instructor: User = { id: "teacher-1", name: "Teacher", email: "teacher@example.test", passwordHash: "", role: "instructor", bio: "", avatar: "", createdAt: "" };
const otherInstructor: User = { ...instructor, id: "teacher-2" };
const student: User = { ...instructor, id: "learner-1", role: "student" };
const course: Course = {
  id: "course-1", slug: "course", title: "Course", subtitle: "", description: "", category: "Design", level: "Beginner", duration: "", image: "", instructorId: instructor.id, instructorName: instructor.name, status: "published", outcomes: [], prerequisites: [], createdAt: "",
  modules: [{ id: "module-1", title: "Module", lessons: [{ id: "l1", title: "One", description: "", duration: 1, type: "text", content: "" }, { id: "l2", title: "Two", description: "", duration: 1, type: "text", content: "" }] }]
};
const assessment: Assessment = { id: "assessment-1", courseId: course.id, title: "Check", passingScore: 70, questions: [
  { id: "q1", prompt: "Q1", options: ["A", "B"], correctIndex: 1 },
  { id: "q2", prompt: "Q2", options: ["A", "B"], correctIndex: 0 }
] };

test("authorization checks roles and instructor ownership", () => {
  assert.equal(roleAllowed(student, ["student"]), true);
  assert.equal(roleAllowed(student, ["admin"]), false);
  assert.equal(canManageCourse(instructor, course), true);
  assert.equal(canManageCourse(otherInstructor, course), false);
});

test("published courses are public and drafts private to their owner", () => {
  assert.equal(canViewCourse(course), true);
  assert.equal(canViewCourse({ ...course, status: "draft" }, student), false);
  assert.equal(canViewCourse({ ...course, status: "draft" }, instructor), true);
});
test("enrollment creation prevents duplicates", () => {
  const first = findOrCreateEnrollment(store, student.id, course.id);
  const second = findOrCreateEnrollment(store, student.id, course.id);
  assert.equal(second.id, first.id);
  assert.equal(store.enrollments.length, 1);
});
test("assessment grading uses submitted answers and configured pass mark", () => {
  assert.deepEqual(gradeAssessment(assessment, { q1: 1, q2: 0 }), { score: 100, passed: true, totalQuestions: 2 });
  assert.equal(gradeAssessment(assessment, { q1: 0, q2: 0 }).passed, false);
});
test("assessment rejects missing, extra, and out-of-range answers", () => {
  assert.throws(() => gradeAssessment(assessment, { q1: 1 }));
  assert.throws(() => gradeAssessment(assessment, { q1: 1, q2: 9 }));
  assert.throws(() => gradeAssessment(assessment, { q1: 1, q2: 0, other: 1 }));
});
test("certificates require every course lesson to be completed", () => {
  const enrollment: Enrollment = { id: "enrol-1", userId: student.id, courseId: course.id, completedLessonIds: ["l1"], enrolledAt: "" };
  assert.equal(canIssueCertificate(course, enrollment), false);
  assert.equal(canIssueCertificate(course, { ...enrollment, completedLessonIds: ["l1", "l2"] }), true);
});
