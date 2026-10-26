"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Bookmark, ChartNoAxesCombined, CircleHelp, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { api, type CurrentUser } from "@/lib/api";

const links = {
  student: [{ href: "/student/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/student/courses", label: "My learning", icon: BookOpen }, { href: "/student/assessments", label: "Assessments", icon: ClipboardCheck }, { href: "/student/bookmarks", label: "Bookmarks", icon: Bookmark }, { href: "/student/certificates", label: "Certificates", icon: GraduationCap }],
  instructor: [{ href: "/instructor/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/instructor/courses", label: "My courses", icon: BookOpen }, { href: "/instructor/analytics", label: "Analytics", icon: ChartNoAxesCombined }],
  admin: [{ href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/admin/users", label: "Users", icon: Users }, { href: "/admin/courses", label: "Course review", icon: BookOpen }]
};

export default function PortalFrame({ role, title, subtitle, children }: { role: CurrentUser["role"]; title: string; subtitle: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    api<{ user: CurrentUser }>("/auth/me").then(result => {
      if (result.user.role !== role) { router.replace(`/${result.user.role}/dashboard`); return; }
      setUser(result.user);
      setStatus("ready");
    }).catch(() => { router.replace("/login"); setStatus("error"); });
  }, [role, router]);
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.push("/");
  }
  if (status !== "ready" || !user) return <main className="loading-page"><span className="spinner" /> Loading your workspace…</main>;
  return <main className="portal-shell"><aside className="portal-sidebar"><Link href="/" className="brand portal-brand"><span className="brand-icon"><BookOpen size={18} /></span><span>Aster<span className="brand-light"> Learning</span></span></Link><span className="portal-label">{role} workspace</span><nav className="portal-nav">{links[role].map(({ href, label, icon: Icon }) => <Link key={href} className={pathname === href ? "active" : ""} href={href}><Icon size={18} />{label}</Link>)}</nav><div className="sidebar-bottom"><Link href={`/${role}/settings`}><Settings size={18} /> Settings</Link><button onClick={logout}><LogOut size={18} /> Sign out</button></div></aside><section className="portal-main"><header className="portal-topbar"><span>{role.charAt(0).toUpperCase() + role.slice(1)} workspace</span><div className="portal-user"><span className="avatar-small">{user.avatar || user.name.slice(0, 1)}</span><span>{user.name}<small>{user.role}</small></span><button onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div></header><div className="portal-content"><div className="portal-page-heading"><div><span className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span><h1>{title}</h1><p>{subtitle}</p></div><div className="portal-greeting">Welcome back, <strong>{user.name.split(" ")[0]}</strong></div></div>{children}</div><Link href="/contact" className="help-link"><CircleHelp size={16} /> Need a hand?</Link></section></main>;
}
