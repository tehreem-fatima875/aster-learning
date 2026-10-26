"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Plus, Users } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ enrollments: 0, completions: 0 });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = () => Promise.all([api<{ courses: Course[] }>("/instructor/courses"), api<{ enrollments: number; completions: number }>("/instructor/analytics")]).then(([courseList, analytics]) => { setCourses(courseList.courses); setStats(analytics); }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load courses."));
  useEffect(() => { void refresh(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(["title", "subtitle", "description", "category", "level", "duration"].map(name => [name, form.get(name)]));
    try { await api("/instructor/courses", { method: "POST", body: JSON.stringify({ ...body, outcomes: [String(form.get("outcome") ?? "")] }) }); setNotice("Draft created. You can submit it for review from your course list."); setFormOpen(false); await refresh(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t create this course."); }
    finally { setBusy(false); }
  }
  return <PortalFrame role="instructor" title="Teach what you know." subtitle="Create a course, support your learners, and see the progress they make.">
    {error && <div className="portal-alert" role="alert">{error}</div>}{notice && <div className="portal-success" role="status">{notice}</div>}
    <div className="metric-grid"><div className="metric-card"><span><BookOpen size={17} /> Your courses</span><strong>{courses.length}</strong><small>Drafts and published learning</small></div><div className="metric-card"><span><Users size={17} /> Enrollments</span><strong>{stats.enrollments}</strong><small>Learners in your courses</small></div><div className="metric-card"><span><CheckCircle2 size={17} /> Completions</span><strong>{stats.completions}</strong><small>Courses completed by learners</small></div></div>
    <div className="portal-section-heading"><div><span className="eyebrow">YOUR COURSE LIBRARY</span><h2>Courses you&apos;re shaping</h2></div><button className="button button-small" onClick={() => setFormOpen(!formOpen)}><Plus size={16} /> Create course</button></div>
    {formOpen && <form className="course-editor" onSubmit={create}><div className="editor-heading"><h3>Start a course draft</h3><p>Keep your course clear, useful, and focused on learner outcomes.</p></div><div className="editor-grid"><label>Course title<input name="title" required minLength={3} maxLength={120} /></label><label>Category<input name="category" required placeholder="e.g. Design" /></label><label>Short summary<input name="subtitle" required minLength={5} maxLength={180} /></label><label>Level<select name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Estimated duration<input name="duration" placeholder="e.g. 4 hours" /></label><label>Learning outcome<input name="outcome" required placeholder="What will learners be able to do?" /></label><label className="full-field">Course description<textarea name="description" required minLength={20} rows={4} /></label></div><div className="editor-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save draft"} <ArrowRight size={16} /></button></div></form>}
    {courses.length ? <div className="admin-table-wrap"><table><thead><tr><th>Course</th><th>Status</th><th>Lessons</th><th>Action</th></tr></thead><tbody>{courses.map(course => <tr key={course.id}><td><strong>{course.title}</strong><small>{course.category} · {course.level}</small></td><td><span className={`status-pill status-${course.status}`}>{course.status}</span></td><td>{course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}</td><td>{course.status === "draft" ? <button className="text-button" onClick={() => api(`/instructor/courses/${course.id}/submit`, { method: "POST" }).then(() => { setNotice("Course submitted for administrator review."); void refresh(); }).catch(exception => setError(exception.message))}>Submit for review <ArrowRight size={14} /></button> : <span className="muted">—</span>}</td></tr>)}</tbody></table></div> : <div className="portal-empty"><h3>Your teaching space is ready.</h3><p>Create your first course draft, then submit it for review before publishing.</p><button className="button" onClick={() => setFormOpen(true)}>Create a course <Plus size={16} /></button></div>}
    <div className="portal-footnote">Course review and publication state are managed by the platform. No paid enrollment or payment processing is available.</div>
  </PortalFrame>;
}
