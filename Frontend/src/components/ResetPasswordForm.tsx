"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    try {
      const result = await api<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
      setMessage(result.message);
      setError("");
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t reset your password."); }
  }
  return <main className="auth-page"><div className="auth-visual"><div className="auth-message"><span className="eyebrow eyebrow-light">WELCOME TO WHAT&apos;S NEXT</span><h1>Keep your<br />momentum.</h1><p>One small step can get you back on your learning path.</p></div><span className="auth-visual-foot">ASTER LEARNING · A DEMONSTRATION PLATFORM</span></div><div className="auth-form-side"><div className="auth-form-wrap"><Link href="/login" className="back-link">← Back to sign in</Link><span className="eyebrow">CHOOSE A NEW PASSWORD</span><h2>Let&apos;s get you back in.</h2><p className="auth-intro">Choose a strong password with at least 10 characters.</p>{message ? <div className="portal-success" role="status">{message} <Link href="/login">Sign in</Link></div> : <form className="form-stack" onSubmit={submit}><label>New password<input type="password" name="password" required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-submit" disabled={!token}>Update password</button>{!token && <p className="auth-legal">This reset link is missing or invalid. <Link href="/forgot-password">Request a new one</Link>.</p>}</form>}</div></div></main>;
}
