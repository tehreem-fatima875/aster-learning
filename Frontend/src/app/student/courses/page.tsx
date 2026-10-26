"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type EnrollmentView = { course: Course; progress: number; enrollment: { completedLessonIds: string[]; lastLessonId?: string } };
export default function MyCoursesPage() {
  const [items, setItems] = useState<EnrollmentView[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<{ enrollments: EnrollmentView[] }>("/student/enrollments").then(result => setItems(result.enrollments)).catch(exception => setError(exception.message)); }, []);
  return <PortalFrame role="student" title="My learning." subtitle="All the courses you’ve started, in one place.">{error && <div className="portal-alert">{error}</div>}{items.length ? <div className="learning-list">{items.map(({ course, progress, enrollment }) => {
    const lessons = course.modules.flatMap(module => module.lessons);
    const lesson = lessons.find(item => item.id === enrollment.lastLessonId) ?? lessons.find(item => !enrollment.completedLessonIds.includes(item.id));
    return <article className="learning-card" key={course.id}><div className="learning-cover" style={{ backgroundImage: `url("${course.image}")` }} /><div className="learning-info"><div className="course-meta"><span>{course.category}</span></div><h3>{course.title}</h3><p>{progress === 100 ? "Course complete" : `${progress}% complete · ${lesson?.title ?? "Ready to begin"}`}</p><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>{lesson && <Link className="button button-small" href={`/student/learn/${course.id}/${lesson.id}`}><Play size={14} /> {progress ? "Continue" : "Start"}</Link>}</article>;
  })}</div> : <div className="portal-empty"><h3>No courses yet.</h3><p>Explore the Aster collection and enroll for free to get started.</p><Link className="button" href="/courses">Explore courses <ArrowRight size={16} /></Link></div>}</PortalFrame>;
}
