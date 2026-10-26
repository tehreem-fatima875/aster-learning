"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    try {
      const form = new FormData(formElement);
      const result = await api<{ message: string }>("/contact", { method: "POST", body: JSON.stringify({ name: form.get("name"), email: form.get("email"), message: form.get("message") }) });
      setSuccess(result.message);
      formElement.reset();
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t send your message."); }
    finally { setBusy(false); }
  }
  return <main className="section-wrap contact-page"><div className="contact-intro"><span className="eyebrow">WE&apos;RE HERE TO HELP</span><h1>Let&apos;s talk about<br /><span>what you&apos;re learning.</span></h1><p>Questions, feedback, or an idea for a course? Send a note and we&apos;ll be glad to hear from you.</p><div className="contact-note"><strong>A note about this demo</strong><p>Messages are validated and held in the running local development process. No email is sent or stored permanently.</p></div></div><form className="contact-form" onSubmit={submit}><h2>Send us a message</h2><label>Your name<input name="name" required minLength={2} maxLength={80} /></label><label>Email address<input name="email" type="email" required /></label><label>Your message<textarea name="message" rows={6} required minLength={10} maxLength={3000} /></label>{success && <div className="portal-success" role="status">{success}</div>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button" disabled={busy}>{busy ? "Sending…" : "Send message"}</button></form></main>;
}
