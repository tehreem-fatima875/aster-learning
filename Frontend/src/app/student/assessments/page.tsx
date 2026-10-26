"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type Enrollment = { course: Course };
type Question = { id: string; prompt: string; options: string[] };
type Assessment = { id: string; title: string; passingScore: number; questions: Question[] };
type Attempt = { id: string; assessmentId: string; score: number; passed: boolean; submittedAt: string };

export default function StudentAssessmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api<{ enrollments: Enrollment[] }>("/student/enrollments"), api<{ attempts: Attempt[] }>("/student/attempts")]).then(([result, history]) => {
      setCourses(result.enrollments.map(item => item.course));
      setAttempts(history.attempts);
      if (result.enrollments[0]) setCourseId(result.enrollments[0].course.id);
    }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load assessments."));
  }, []);
  useEffect(() => {
    if (!courseId) return;
    api<{ assessments: Assessment[] }>(`/student/courses/${courseId}/assessments`).then(result => {
      setAssessment(result.assessments[0] ?? null);
      setAnswers({});
      setMessage("");
    }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load this assessment."));
  }, [courseId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assessment) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ attempt: Attempt }>(`/student/assessments/${assessment.id}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
      setAttempts(current => [result.attempt, ...current]);
      setMessage(`You scored ${result.attempt.score}%. ${result.attempt.passed ? "You passed — well done." : `The passing score is ${assessment.passingScore}%. Review the lessons and try again.`}`);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t submit your answers."); }
    finally { setBusy(false); }
  }
  return <PortalFrame role="student" title="Check in with what you know." subtitle="Assessments are a chance to reflect—not just a score.">
    {error && <div className="portal-alert" role="alert">{error}</div>}
    {!courses.length ? <div className="portal-empty"><span className="empty-icon"><ClipboardCheck size={21} /></span><h3>Assessments come with your learning.</h3><p>Enroll in a course to see its knowledge checks here.</p></div> : <>
      <label className="assessment-course-select">Choose a course<select value={courseId} onChange={event => setCourseId(event.target.value)}>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
      {assessment ? <form className="assessment-form" onSubmit={submit}><span className="eyebrow">{assessment.passingScore}% PASSING SCORE</span><h2>{assessment.title}</h2><p className="assessment-intro">Choose the best answer for each question. Your score is calculated when you submit.</p>{assessment.questions.map((question, index) => <fieldset className="question-card" key={question.id}><legend><span>{String(index + 1).padStart(2, "0")}</span>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label className="answer-option" key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers(current => ({ ...current, [question.id]: optionIndex }))} required />{option}</label>)}</fieldset>)}{message && <div className="portal-success" role="status">{message}</div>}<button className="button" disabled={busy}>{busy ? "Submitting…" : "Submit answers"} <ArrowRight size={16} /></button></form> : <div className="portal-empty"><h3>No assessment for this course yet.</h3><p>Check another enrolled course or return later.</p></div>}
      {attempts.length > 0 && <section className="attempt-history"><h2>Recent attempts</h2>{attempts.map(attempt => <div key={attempt.id}><span>{new Date(attempt.submittedAt).toLocaleDateString()}</span><strong>{attempt.score}%</strong><span className={attempt.passed ? "attempt-passed" : "attempt-not-passed"}>{attempt.passed ? "Passed" : "Keep practicing"}</span></div>)}</section>}
    </>}
  </PortalFrame>;
}
