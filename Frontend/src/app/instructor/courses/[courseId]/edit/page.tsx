"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api, type Course } from "@/lib/api";

type QuestionDraft = { prompt: string; options: string; correctIndex: string };
type Assessment = { id: string; title: string; passingScore: number; questions: { prompt: string }[] };
const newQuestion = (): QuestionDraft => ({ prompt: "", options: "", correctIndex: "0" });

export default function InstructorAssessmentEditor() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => Promise.all([
    api<{ courses: Course[] }>("/instructor/courses"),
    api<{ assessments: Assessment[] }>(`/instructor/courses/${params.courseId}/assessments`)
  ]).then(([courseResult, assessmentResult]) => {
    setCourse(courseResult.courses.find(item => item.id === params.courseId) ?? null);
    setAssessments(assessmentResult.assessments);
  }).catch(exception => setError(exception instanceof Error ? exception.message : "Couldn’t load course assessments."));
  useEffect(() => { void load(); }, [params.courseId]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const questionPayload = questions.map(question => ({
      prompt: question.prompt,
      options: question.options.split(/\r?\n/).map(option => option.trim()).filter(Boolean),
      correctIndex: Number(question.correctIndex)
    }));
    try {
      await api(`/instructor/courses/${params.courseId}/assessments`, { method: "POST", body: JSON.stringify({ title: form.get("title"), passingScore: Number(form.get("passingScore")), questions: questionPayload }) });
      setNotice("Assessment saved. It is now available to enrolled learners.");
      setQuestions([newQuestion()]);
      formElement.reset();
      await load();
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t save this assessment."); }
    finally { setBusy(false); }
  }
  return <PortalFrame role="instructor" title={course?.title ?? "Course assessments"} subtitle="Create and review knowledge checks for your learners.">
    <Link href="/instructor/courses" className="back-link"><ArrowLeft size={15} /> Back to courses</Link>
    {error && <div className="portal-alert" role="alert">{error}</div>}{notice && <div className="portal-success" role="status">{notice}</div>}
    {assessments.length > 0 && <section className="existing-assessments"><h2>Available assessments</h2>{assessments.map(item => <article key={item.id}><strong>{item.title}</strong><span>{item.questions.length} questions · {item.passingScore}% to pass</span></article>)}</section>}
    <form className="course-editor assessment-editor" onSubmit={create}><div className="editor-heading"><h3>Create an assessment</h3><p>Answers are kept private from learners until their attempt is submitted.</p></div><div className="editor-grid"><label>Assessment title<input name="title" required minLength={3} maxLength={120} /></label><label>Passing score (%)<input name="passingScore" type="number" min={0} max={100} defaultValue={70} required /></label></div>
      <div className="assessment-question-list">{questions.map((question, index) => { const options = question.options.split(/\r?\n/).map(option => option.trim()).filter(Boolean); return <fieldset className="question-card instructor-question" key={index}><legend>Question {index + 1}</legend><label>Prompt<input value={question.prompt} onChange={event => setQuestions(current => current.map((item, i) => i === index ? { ...item, prompt: event.target.value } : item))} required minLength={5} maxLength={500} /></label><label>Answer options<textarea value={question.options} onChange={event => setQuestions(current => current.map((item, i) => i === index ? { ...item, options: event.target.value } : item))} placeholder={"One answer per line\nSecond answer"} rows={3} required /></label><label>Correct answer<select value={question.correctIndex} onChange={event => setQuestions(current => current.map((item, i) => i === index ? { ...item, correctIndex: event.target.value } : item))}>{options.map((option, optionIndex) => <option value={optionIndex} key={optionIndex}>{optionIndex + 1}. {option}</option>)}</select></label>{questions.length > 1 && <button type="button" className="remove-question" onClick={() => setQuestions(current => current.filter((_, i) => i !== index))}><Trash2 size={14} /> Remove question</button>}</fieldset>; })}</div>
      <div className="editor-actions"><button type="button" className="button button-outline" onClick={() => setQuestions(current => [...current, newQuestion()])}><Plus size={15} /> Add question</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save assessment"}</button></div>
    </form>
  </PortalFrame>;
}
