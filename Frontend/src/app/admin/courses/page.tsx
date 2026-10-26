"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const load = () => api<{ courses: Course[] }>("/admin/courses").then(result => setCourses(result.courses)).catch(exception => setError(exception.message));
  useEffect(() => { void load(); }, []);
  async function moderate(courseId: string, status: "published" | "rejected") {
    try { await api(`/admin/courses/${courseId}/moderate`, { method: "PATCH", body: JSON.stringify({ status }) }); await load(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t update course."); }
  }
  return <PortalFrame role="admin" title="Course review." subtitle="Review instructor submissions and keep the course collection thoughtful.">{error && <div className="portal-alert">{error}</div>}<div className="admin-table-wrap"><table><thead><tr><th>Course</th><th>Instructor</th><th>Level</th><th>Status</th><th>Moderation</th></tr></thead><tbody>{courses.map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.category}</small></td><td>{course.instructorName}</td><td>{course.level}</td><td><span className={`status-pill status-${course.status}`}>{course.status}</span></td><td>{course.status === "pending" ? <div className="table-actions"><button className="approve-button" aria-label={`Approve ${course.title}`} onClick={() => void moderate(course.id, "published")}><Check size={15} /></button><button className="reject-button" aria-label={`Reject ${course.title}`} onClick={() => void moderate(course.id, "rejected")}><X size={15} /></button></div> : "—"}</td></tr>)}</tbody></table></div></PortalFrame>;
}
