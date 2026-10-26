"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, GraduationCap, Play } from "lucide-react";
import { useEffect, useState } from "react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type EnrollmentView = { enrollment: { id: string; completedLessonIds: string[]; lastLessonId?: string }; course: Course; progress: number };
export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<EnrollmentView[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [certificates, setCertificates] = useState<number>(0);
  const refresh = () => Promise.all([
    api<{ enrollments: EnrollmentView[] }>("/student/enrollments"),
    api<{ courses: Course[] }>("/courses?limit=3"),
    api<{ certificates: unknown[] }>("/student/certificates")
  ]).then(([enrolled, courses, certs]) => { setEnrollments(enrolled.enrollments); setAvailable(courses.courses); setCertificates(certs.certificates.length); }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load your learning overview."));
  useEffect(() => { void refresh(); }, []);
  return <PortalFrame role="student" title="Your learning, at a glance." subtitle="A little progress adds up. Pick up where you left off or find something new.">
    {error && <div className="portal-alert" role="alert">{error} <button onClick={() => void refresh()}>Try again</button></div>}
    <div className="metric-grid"><div className="metric-card"><span><BookOpen size={17} /> In progress</span><strong>{enrollments.filter(item => item.progress < 100).length}</strong><small>Courses you&apos;re learning</small></div><div className="metric-card"><span><CheckCircle2 size={17} /> Lessons completed</span><strong>{enrollments.reduce((count, item) => count + item.enrollment.completedLessonIds.length, 0)}</strong><small>Every step counts</small></div><div className="metric-card"><span><GraduationCap size={17} /> Certificates</span><strong>{certificates}</strong><small>Achievements earned</small></div></div>
    <div className="portal-section-heading"><div><span className="eyebrow">KEEP YOUR MOMENTUM</span><h2>Continue learning</h2></div><Link href="/student/courses">All courses <ArrowRight size={15} /></Link></div>
    {enrollments.length ? <div className="learning-list">{enrollments.map(({ course, progress, enrollment }) => {
      const lesson = course.modules.flatMap(module => module.lessons).find(item => item.id === enrollment.lastLessonId) ?? course.modules.flatMap(module => module.lessons).find(item => !enrollment.completedLessonIds.includes(item.id));
      return <article className="learning-card" key={course.id}><div className="learning-cover" style={{ backgroundImage: `url("${course.image}")` }} /><div className="learning-info"><div className="course-meta"><span>{course.category}</span><span className="meta-dot" /><span><Clock3 size={14} /> {course.duration}</span></div><h3>{course.title}</h3><p>{lesson ? `Next up: ${lesson.title}` : "Course completed — congratulations!"}</p><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{progress}% complete</small></div><Link href={lesson ? `/student/learn/${course.id}/${lesson.id}` : "/student/certificates"} className="button button-small"><Play size={15} /> {progress === 100 ? "View certificate" : progress > 0 ? "Continue" : "Start course"}</Link></article>;
    })}</div> : <div className="portal-empty"><div className="empty-icon"><BookOpen size={21} /></div><h3>Your learning journey starts here.</h3><p>Explore the course collection and enroll for free when you find a good fit.</p><Link href="/courses" className="button">Explore courses <ArrowRight size={16} /></Link></div>}
    <div className="portal-section-heading"><div><span className="eyebrow">FIND YOUR NEXT STEP</span><h2>Worth a closer look</h2></div><Link href="/courses">Explore all <ArrowRight size={15} /></Link></div><div className="mini-course-grid">{available.map(course => <Link href={`/courses/${course.slug}`} className="mini-course-card" key={course.id}><span className="course-category">{course.category}</span><h3>{course.title}</h3><p>{course.subtitle}</p><span>{course.level} · {course.duration}</span></Link>)}</div>
  </PortalFrame>;
}
