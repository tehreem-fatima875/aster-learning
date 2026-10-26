export type Role = "student" | "instructor" | "admin";
export type CourseStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  bio: string;
  avatar: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: "text" | "video";
  content: string;
  resourceUrl?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  image: string;
  instructorId: string;
  instructorName: string;
  status: CourseStatus;
  outcomes: string[];
  prerequisites: string[];
  modules: CourseModule[];
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId?: string;
  enrolledAt: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
}
