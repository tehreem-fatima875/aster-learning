"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Users, UserRound, Check, X } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type Overview = { users: number; students: number; instructors: number; courses: number; pendingCourses: number; enrollments: number; assessments: number };
export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const refresh = () => Promise.all([api<Overview>("/admin/overview"), api<{ courses: Course[] }>("/admin/courses")]).then(([stats, all]) => { setOverview(stats); setCourses(all.courses); }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load platform data."));
  useEffect(() => { void refresh(); }, []);
  async function moderate(courseId: string, status: "published" | "rejected") {
    try { await api(`/admin/courses/${courseId}/moderate`, { method: "PATCH", body: JSON.stringify({ status }) }); await refresh(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t update course."); }
  }
  return <PortalFrame role="admin" title="Platform overview." subtitle="A clear view of the learning community and its activity.">
    {error && <div className="portal-alert" role="alert">{error}</div>}
    <div className="metric-grid">{[
      ["People", overview?.users, <Users size={17} key="u" />, `${overview?.students ?? 0} learners · ${overview?.instructors ?? 0} instructors`],
      ["Courses", overview?.courses, <BookOpen size={17} key="c" />, `${overview?.pendingCourses ?? 0} awaiting review`],
      ["Enrollments", overview?.enrollments, <GraduationCap size={17} key="e" />, "Current course registrations"],
      ["Assessments", overview?.assessments, <UserRound size={17} key="a" />, "Knowledge checks available"]
    ].map(([label, value, icon, note]) => <div className="metric-card" key={String(label)}><span>{icon} {label}</span><strong>{value ?? "—"}</strong><small>{note}</small></div>)}</div>
    <div className="portal-section-heading"><div><span className="eyebrow">CONTENT REVIEW</span><h2>Courses for approval</h2></div><span className="result-count">{courses.filter(course => course.status === "pending").length} pending</span></div>
    <div className="admin-table-wrap"><table><thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Review</th></tr></thead><tbody>{courses.filter(course => course.status === "pending").map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.category} · {course.level}</small></td><td>{course.instructorName}</td><td><span className="status-pill status-pending">Pending review</span></td><td><div className="table-actions"><button aria-label={`Approve ${course.title}`} className="approve-button" onClick={() => void moderate(course.id, "published")}><Check size={16} /></button><button aria-label={`Reject ${course.title}`} className="reject-button" onClick={() => void moderate(course.id, "rejected")}><X size={16} /></button></div></td></tr>)}</tbody></table>{!courses.some(course => course.status === "pending") && <div className="table-empty">No courses are awaiting review.</div>}</div>
    <div className="portal-footnote">Metrics are calculated from the current demonstration data adapter. Configure a database adapter for durable production data.</div>
  </PortalFrame>;
}
