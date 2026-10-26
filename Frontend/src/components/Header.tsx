"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={20} /></span><span>Aster<span className="brand-light"> Learning</span></span></Link>
        <button className="mobile-menu" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={open ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          <Link href="/courses" onClick={() => setOpen(false)}>Explore courses</Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
          <div className="nav-actions"><Link href="/login" className="login-link">Log in</Link><Link href="/register" className="button button-small">Get started</Link></div>
        </nav>
      </div>
    </header>
  );
}
