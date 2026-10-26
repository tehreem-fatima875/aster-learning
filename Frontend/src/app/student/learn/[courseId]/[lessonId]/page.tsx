"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type EnrollmentView = { enrollment: { completedLessonIds: string[]; lastLessonId?: string }; course: Course };
export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const [data, setData] = useState<EnrollmentView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ enrollments: EnrollmentView[] }>("/student/enrollments").then(result => {
    const current = result.enrollments.find(item => item.course.id === params.courseId);
    if (!current) { setError("Enroll in this course before opening lessons."); return; }
    setData(current);
  }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load lesson.")); }, [params.courseId]);
  const lessons = data?.course.modules.flatMap(module => module.lessons) ?? [];
  const lesson = lessons.find(item => item.id === params.lessonId);
  async function complete() {
    setBusy(true);
    try {
      await api(`/student/courses/${params.courseId}/lessons/${params.lessonId}/complete`, { method: "POST" });
      const index = lessons.findIndex(item => item.id === params.lessonId);
      if (index < lessons.length - 1) router.push(`/student/learn/${params.courseId}/${lessons[index + 1].id}`);
      else router.push("/student/dashboard");
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t update your progress."); }
    finally { setBusy(false); }
  }
  return <PortalFrame role="student" title={data?.course.title ?? "Your lesson"} subtitle="A focused moment for learning something new.">
    {error && <div className="portal-alert" role="alert">{error} <Link href="/courses">Explore courses</Link></div>}
    {data && lesson && <div className="lesson-layout"><aside className="lesson-outline"><Link className="back-link" href="/student/dashboard"><ArrowLeft size={15} /> My learning</Link><h3>Course contents</h3>{data.course.modules.map(module => <div className="outline-module" key={module.id}><strong>{module.title}</strong>{module.lessons.map(item => <div className={item.id === lesson.id ? "outline-lesson active" : "outline-lesson"} key={item.id}>{data.enrollment.completedLessonIds.includes(item.id) ? <CheckCircle2 size={15} /> : item.id === lesson.id ? <Circle size={15} /> : <LockKeyhole size={14} />}<span>{item.title}</span></div>)}</div>)}</aside><article className="lesson-content"><span className="eyebrow">{data.course.category} · {lesson.duration} MIN</span><h1>{lesson.title}</h1><p className="lesson-lede">{lesson.description}</p><div className="lesson-reading">{lesson.content.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}<div className="lesson-reflection"><strong>Take a moment</strong><p>What is one idea from this lesson you can apply to your own work this week?</p></div></div><div className="lesson-navigation"><button className="button button-outline" onClick={() => { const index = lessons.findIndex(item => item.id === lesson.id); if (index > 0) router.push(`/student/learn/${params.courseId}/${lessons[index - 1].id}`); }} disabled={lessons[0].id === lesson.id}><ArrowLeft size={16} /> Previous</button><button className="button" onClick={complete} disabled={busy}>{busy ? "Saving…" : "Mark complete & continue"} <ArrowRight size={16} /></button></div></article></div>}
  </PortalFrame>;
}
