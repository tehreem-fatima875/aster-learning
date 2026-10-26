const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  image: string;
  instructorName: string;
  status: string;
  outcomes: string[];
  prerequisites: string[];
  modules: { id: string; title: string; lessons: { id: string; title: string; description: string; duration: number; content: string }[] }[];
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  bio: string;
  avatar: string;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Something went wrong. Please try again.");
  return data as T;
}
