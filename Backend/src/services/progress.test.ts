import assert from "node:assert/strict";
import test from "node:test";
import type { Course, Enrollment } from "../types/domain";
import { lessonIds, progressPercent } from "./progress";

const course: Course = {
  id: "c", slug: "course", title: "Course", subtitle: "", description: "", category: "Design", level: "Beginner", duration: "", image: "", instructorId: "i", instructorName: "", status: "published", outcomes: [], prerequisites: [], createdAt: "",
  modules: [{ id: "m", title: "Module", lessons: [
    { id: "l1", title: "One", description: "", duration: 1, type: "text", content: "" },
    { id: "l2", title: "Two", description: "", duration: 1, type: "text", content: "" }
  ] }]
};
const enrollment: Enrollment = { id: "e", userId: "u", courseId: "c", completedLessonIds: ["l1"], enrolledAt: "" };

test("lesson progress uses actual lesson completion", () => {
  assert.deepEqual(lessonIds(course), ["l1", "l2"]);
  assert.equal(progressPercent(course, enrollment), 50);
});
test("lesson progress returns zero for courses with no lessons", () => {
  assert.equal(progressPercent({ ...course, modules: [] }, enrollment), 0);
});
