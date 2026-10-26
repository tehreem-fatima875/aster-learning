import type { Course, Enrollment } from "../types/domain";

export function lessonIds(course: Course): string[] {
  return course.modules.flatMap(module => module.lessons.map(lesson => lesson.id));
}

export function progressPercent(course: Course, enrollment: Enrollment): number {
  const ids = lessonIds(course);
  if (!ids.length) return 0;
  const completed = new Set(enrollment.completedLessonIds);
  return Math.round(ids.filter(id => completed.has(id)).length / ids.length * 100);
}
