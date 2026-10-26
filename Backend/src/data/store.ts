import type { Assessment, Certificate, Course, Enrollment, QuizAttempt, User } from "../types/domain";

export interface Store {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  assessments: Assessment[];
  attempts: QuizAttempt[];
  certificates: Certificate[];
  bookmarks: Set<string>;
}

export const store: Store = {
  users: [],
  courses: [],
  enrollments: [],
  assessments: [],
  attempts: [],
  certificates: [],
  bookmarks: new Set()
};

export const enrollmentKey = (userId: string, courseId: string) => `${userId}:${courseId}`;
