"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setError("");
    try {
      const result = await api<{ message: string; developmentResetToken?: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setMessage(result.message);
      if (result.developmentResetToken) setResetLink(`${window.location.origin}/reset-password?token=${result.developmentResetToken}`);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Please try again."); }
  }
  return <main className="auth-page"><div className="auth-visual"><div className="auth-message"><span className="eyebrow eyebrow-light">A FRESH START</span><h1>Your next step<br />is still yours.</h1><p>We’ll help you get back to learning.</p></div><span className="auth-visual-foot">ASTER LEARNING · A DEMONSTRATION PLATFORM</span></div><div className="auth-form-side"><div className="auth-form-wrap"><Link href="/login" className="back-link">← Back to sign in</Link><span className="eyebrow">ACCOUNT RECOVERY</span><h2>Forgot your password?</h2><p className="auth-intro">Enter the email associated with your account and we&apos;ll help you reset it.</p>
    {message ? <div className="portal-success" role="status">{message}{resetLink && <p className="dev-reset"><strong>Local development reset link:</strong><br /><a href={resetLink}>Set a new password</a></p>}</div> : <form onSubmit={submit} className="form-stack"><label>Email address<input type="email" name="email" autoComplete="email" required placeholder="you@example.com" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-submit">Request reset link</button></form>}
    <p className="auth-legal">Email delivery is not configured. In local development, the reset link is shown here; production email integration is required for delivery.</p></div></div></main>;
}
