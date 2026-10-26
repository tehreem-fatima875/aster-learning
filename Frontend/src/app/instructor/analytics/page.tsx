"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Users } from "lucide-react";
import PortalFrame from "@/components/PortalFrame";
import { api } from "@/lib/api";

export default function InstructorAnalyticsPage() {
  const [stats, setStats] = useState<{ courses: number; enrollments: number; completions: number } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<typeof stats>("/instructor/analytics").then(result => setStats(result)).catch(exception => setError(exception.message)); }, []);
  return <PortalFrame role="instructor" title="Learning in motion." subtitle="A simple snapshot of learner activity across your courses.">{error && <div className="portal-alert">{error}</div>}<div className="metric-grid"><div className="metric-card"><span><BookOpen size={17} /> Courses</span><strong>{stats?.courses ?? "—"}</strong><small>Your authored course content</small></div><div className="metric-card"><span><Users size={17} /> Enrollments</span><strong>{stats?.enrollments ?? "—"}</strong><small>Current learner registrations</small></div><div className="metric-card"><span><CheckCircle2 size={17} /> Completions</span><strong>{stats?.completions ?? "—"}</strong><small>Based on completed course lessons</small></div></div><p className="portal-footnote">These counts come from course enrollment and lesson completion records. Trend charts are not available in this demonstration.</p></PortalFrame>;
}
