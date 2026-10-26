"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Bookmark, Clock3, LockKeyhole, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Course } from "@/lib/api";

export default function CourseDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api<{ course: Course }>(`/courses/${params.slug}`).then(result => setCourse(result.course)).catch(exception => setError(exception instanceof Error ? exception.message : "Course not found.")); }, [params.slug]);
  async function enroll() {
    if (!course) return;
    setBusy(true);
    try {
      await api(`/courses/${course.id}/enroll`, { method: "POST" });
      router.push("/student/dashboard");
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : "Please sign in to enroll.";
      if (message.includes("sign in")) router.push("/login");
      else setError(message);
    } finally { setBusy(false); }
  }
  async function toggleBookmark() {
    if (!course) return;
    try {
      await api(`/student/bookmarks/${course.id}`, { method: saved ? "DELETE" : "POST" });
      setSaved(!saved);
      setError("");
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : "Couldn’t update your saved courses.";
      if (message.includes("sign in")) router.push("/login");
      else setError(message);
    }
  }
  if (error && !course) return <main className="not-found section-wrap"><span className="eyebrow">COURSE UNAVAILABLE</span><h1>We couldn&apos;t find that course.</h1><p>{error}</p><Link href="/courses" className="button">Back to courses</Link></main>;
  if (!course) return <main className="loading-page"><span className="spinner" /> Loading course…</main>;
  return <main className="detail-page"><div className="detail-cover" style={{ backgroundImage: `linear-gradient(90deg,rgba(20,26,48,.84),rgba(20,26,48,.12)),url("${course.image}")` }}><div className="section-wrap cover-inner"><Link href="/courses" className="cover-back"><ArrowLeft size={16} /> All courses</Link><span className="eyebrow eyebrow-light">{course.category} · {course.level}</span><h1>{course.title}</h1><p>{course.subtitle}</p><div className="cover-meta"><span><Clock3 size={16} /> {course.duration}</span><span><BookOpen size={16} /> {course.modules.reduce((count, module) => count + module.lessons.length, 0)} lessons</span><span><span className="avatar-small">{course.instructorName.split(" ").map(part => part[0]).join("")}</span>{course.instructorName}</span></div></div></div>{error && <div className="section-wrap detail-alert"><div className="portal-alert" role="alert">{error}</div></div>}
    <div className="section-wrap detail-layout"><section className="detail-main"><span className="eyebrow">ABOUT THIS COURSE</span><h2>Build knowledge you can put to work.</h2><p className="detail-description">{course.description}</p><div className="detail-block"><h3>What you&apos;ll learn</h3><div className="outcome-list">{course.outcomes.map(outcome => <span key={outcome}><BadgeCheck size={17} />{outcome}</span>)}</div></div>{course.prerequisites.length > 0 && <div className="detail-block"><h3>Before you begin</h3><p>{course.prerequisites.join(", ")}</p></div>}    <div className="detail-block"><h3>Course curriculum</h3><div className="curriculum">{course.modules.map((module, index) => <div className="module-card" key={module.id}><div className="module-heading"><span>MODULE {String(index + 1).padStart(2, "0")}</span><strong>{module.title}</strong><small>{module.lessons.length} lessons</small></div>{module.lessons.map(lesson => <div className="lesson-row" key={lesson.id}><PlayCircle size={17} /><span>{lesson.title}<small>{lesson.description}</small></span><span>{lesson.duration} min</span><LockKeyhole className="lesson-lock" size={14} /></div>)}</div>)}</div></div></section>
      <aside className="enroll-card"><div className="enroll-image" style={{ backgroundImage: `url("${course.image}")` }} /><div className="enroll-card-content"><span className="eyebrow">A GOOD PLACE TO START</span><h3>Learn at your own pace.</h3><p>Free to enroll. Come back whenever you&apos;re ready to continue.</p><button className="button button-submit" disabled={busy} onClick={enroll}>{busy ? "Enrolling…" : "Enroll for free"} {!busy && <ArrowRight size={17} />}</button><button className={saved ? "save-course saved" : "save-course"} onClick={toggleBookmark}><Bookmark size={15} fill={saved ? "currentColor" : "none"} />{saved ? "Saved for later" : "Save for later"}</button><small className="enroll-note">No payment required · Course progress is saved</small></div></aside>
    </div></main>;
}
