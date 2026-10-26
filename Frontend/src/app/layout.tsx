import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Aster Learning — Learn with purpose",
  description: "Thoughtful online learning for professionals who want to keep growing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<footer className="site-footer"><div className="footer-inner"><Link className="brand footer-brand" href="/"><span className="brand-icon"><BookOpen size={16} /></span><span>Aster<span className="brand-light"> Learning</span></span></Link><span>Learn with purpose. Grow with confidence.</span><div><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><small>© 2026 Aster Learning · Demonstration platform</small></div></footer></body></html>;
}
