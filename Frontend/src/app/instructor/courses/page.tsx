"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const load = () => api<{ courses: Course[] }>("/instructor/courses").then(result => setCourses(result.courses)).catch(exception => setError(exception.message));
  useEffect(() => { void load(); }, []);
  return <PortalFrame role="instructor" title="Your courses." subtitle="Keep track of drafts, review status, and published learning.">{error && <div className="portal-alert">{error}</div>}<div className="portal-section-heading"><div><span className="eyebrow">COURSE LIBRARY</span><h2>{courses.length} courses</h2></div><Link href="/instructor/dashboard" className="button button-small"><Plus size={15} /> Create course</Link></div>{courses.length ? <div className="admin-table-wrap"><table><thead><tr><th>Course</th><th>Level</th><th>Status</th><th>Lessons</th><th>Actions</th></tr></thead><tbody>{courses.map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.category}</small></td><td>{course.level}</td><td><span className={`status-pill status-${course.status}`}>{course.status}</span></td><td>{course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}</td><td><Link className="text-button" href={`/instructor/courses/${course.id}/edit`}>Assessments</Link>{course.status === "draft" && <> · <button className="text-button" onClick={() => api(`/instructor/courses/${course.id}/submit`, { method: "POST" }).then(load).catch(exception => setError(exception.message))}>Submit for review <ArrowRight size={14} /></button></>}</td></tr>)}</tbody></table></div> : <div className="portal-empty"><h3>Your first course is waiting to take shape.</h3><p>Start with a focused topic and clear learner outcome.</p><Link href="/instructor/dashboard" className="button">Create a course <Plus size={15} /></Link></div>}</PortalFrame>;
}
