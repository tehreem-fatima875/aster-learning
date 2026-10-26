"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PortalFrame from "@/components/PortalFrame";
import { api, type CurrentUser } from "@/lib/api";

export default function AccountSettingsPage() {
  const params = useParams<{ role: string }>();
  const role = params.role;
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { api<{ user: CurrentUser }>("/auth/me").then(result => setUser(result.user)).catch(exception => setError(exception.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: CurrentUser }>("/users/me", { method: "PATCH", body: JSON.stringify({ name: form.get("name"), bio: form.get("bio") }) });
      setUser(result.user);
      setNotice("Your profile has been updated.");
      setError("");
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Couldn’t update your profile."); }
  }
  if (!["student", "instructor", "admin"].includes(role)) return <main className="not-found section-wrap"><h1>Workspace not found.</h1></main>;
  const typedRole = role as CurrentUser["role"];
  if (!user) return <PortalFrame role={typedRole} title="Your account." subtitle="Keep your profile up to date.">{error ? <div className="portal-alert" role="alert">{error}</div> : <div className="loading-page"><span className="spinner" /> Loading profile…</div>}</PortalFrame>;
  return <PortalFrame role={typedRole} title="Your account." subtitle="Keep your profile up to date.">{error && <div className="portal-alert" role="alert">{error}</div>}{notice && <div className="portal-success" role="status">{notice}</div>}<form className="course-editor settings-form" onSubmit={submit}><div className="editor-grid"><label>Full name<input name="name" defaultValue={user?.name ?? ""} required minLength={2} maxLength={80} /></label><label>Email address<input value={user?.email ?? ""} disabled readOnly /></label><label className="full-field">Short bio<textarea name="bio" defaultValue={user?.bio ?? ""} maxLength={500} rows={5} placeholder="A little about what you do and what you're learning." /></label></div><button className="button">Save profile</button><p className="portal-footnote">Email changes and notification preferences are not available in this demo.</p></form></PortalFrame>;
}
