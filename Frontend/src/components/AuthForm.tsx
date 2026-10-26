"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, BookOpen, Eye, EyeOff } from "lucide-react";
import { api, type CurrentUser } from "@/lib/api";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const isRegister = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: CurrentUser }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role })
      });
      router.push(`/${result.user.role}/dashboard`);
      router.refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return <main className="auth-page"><div className="auth-visual"><Link href="/" className="brand auth-brand"><span className="brand-icon"><BookOpen size={19} /></span><span>Aster<span className="brand-light"> Learning</span></span></Link><div className="auth-message"><span className="eyebrow eyebrow-light">LEARN WITH PURPOSE</span><h1>Make room for<br />what&apos;s next.</h1><p>A little learning can change the way you see what&apos;s possible.</p><div className="auth-quote">&ldquo;The beautiful thing about learning is that nobody can take it away from you.&rdquo;<small>— B.B. King</small></div></div><span className="auth-visual-foot">ASTER LEARNING · A DEMONSTRATION PLATFORM</span></div>
    <div className="auth-form-side"><div className="auth-form-wrap"><Link href="/" className="back-link">← Back to Aster</Link><span className="eyebrow">{isRegister ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}</span><h2>{isRegister ? "Create your account" : "Good to have you back."}</h2><p className="auth-intro">{isRegister ? "Join a community of curious, career-minded learners." : "Sign in to pick up where your learning left off."}</p>
      <form onSubmit={submit} className="form-stack">
        {isRegister && <label>Your name<input name="name" type="text" autoComplete="name" placeholder="e.g. Alex Morgan" required minLength={2} maxLength={80} /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 10 characters" : "Enter your password"} required minLength={isRegister ? 10 : 1} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {isRegister && <label>I&apos;m joining as<select value={role} onChange={event => setRole(event.target.value)}><option value="student">A learner</option><option value="instructor">An instructor</option></select></label>}
        {!isRegister && <div className="form-help"><span>Protected with secure session cookies</span><Link href="/forgot-password">Forgot password?</Link></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-submit" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"} {!busy && <ArrowRight size={17} />}</button>
      </form>
      <p className="auth-switch">{isRegister ? "Already learning with us?" : "New to Aster?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
      <p className="auth-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
    </div></div></main>;
}
