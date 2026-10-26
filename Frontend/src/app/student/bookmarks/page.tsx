"use client";

import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

export default function BookmarksPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const load = () => api<{ courses: Course[] }>("/student/bookmarks").then(result => setCourses(result.courses)).catch(exception => setError(exception.message));
  useEffect(() => { void load(); }, []);
  async function remove(courseId: string) {
    try { await api(`/student/bookmarks/${courseId}`, { method: "DELETE" }); await load(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t remove this bookmark."); }
  }
  return <PortalFrame role="student" title="Saved for later." subtitle="Keep the courses that caught your curiosity close by.">{error && <div className="portal-alert">{error}</div>}{courses.length ? <div className="bookmark-list">{courses.map(course => <article key={course.id}><div className="learning-cover" style={{ backgroundImage: `url("${course.image}")` }} /><div><span className="eyebrow">{course.category} · {course.level}</span><h3>{course.title}</h3><p>{course.subtitle}</p><Link href={`/courses/${course.slug}`}>Explore course</Link></div><button aria-label={`Remove ${course.title} from bookmarks`} onClick={() => void remove(course.id)}><Trash2 size={17} /></button></article>)}</div> : <div className="portal-empty"><span className="empty-icon"><Bookmark size={20} /></span><h3>No saved courses yet.</h3><p>Save a course you’d like to explore when you have a little more time.</p><Link href="/courses" className="button">Explore courses</Link></div>}</PortalFrame>;
}
