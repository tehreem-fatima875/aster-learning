"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpenCheck, BriefcaseBusiness, ChartNoAxesCombined, GraduationCap, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import CourseCard from "@/components/CourseCard";
import { api, type Course } from "@/lib/api";

const categories = [
  { name: "Development", icon: BookOpenCheck, note: "Build useful digital skills" },
  { name: "Data", icon: ChartNoAxesCombined, note: "Make data work for you" },
  { name: "Design", icon: Sparkles, note: "Design with intention" },
  { name: "Business", icon: BriefcaseBusiness, note: "Grow your impact" }
];

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => { api<{ courses: Course[] }>("/courses?limit=3").then(result => setCourses(result.courses)).catch(() => setCourses([])); }, []);
  return <main>
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-dot" /> A more thoughtful way to grow</div>
        <h1>Make room for<br /><span>what&apos;s next.</span></h1>
        <p className="hero-description">Practical courses for people who believe their best work is still ahead. Learn at your pace, put ideas to work, and grow with purpose.</p>
        <div className="hero-actions"><Link href="/courses" className="button button-large">Explore courses <ArrowRight size={18} /></Link><Link href="/about" className="text-link">How Aster works <ArrowUpRight size={17} /></Link></div>
        <div className="hero-proof"><div className="avatar-stack"><span>MC</span><span>JE</span><span>AR</span><span>KS</span></div><p><strong>Learning built around real work</strong><br /><span>Thoughtful lessons. Practical outcomes.</span></p></div>
      </div>
      <div className="hero-art">
        <div className="hero-photo" />
        <div className="floating-note note-top"><span className="note-icon"><Target size={17} /></span><span><strong>Learn with purpose</strong><small>Skills that move you forward</small></span></div>
        <div className="floating-note note-bottom"><span className="progress-mark"><BadgeCheck size={19} /></span><span><strong>Small steps, real growth</strong><small>One lesson at a time</small></span></div>
        <div className="hero-art-label"><span>01</span> YOUR NEXT CHAPTER STARTS HERE</div>
      </div>
      <div className="hero-orb" />
    </section>

    <section className="trust-strip"><span>Designed for curious professionals</span><div><span><BriefcaseBusiness size={16} /> Career-minded</span><span><GraduationCap size={18} /> Lifelong learners</span><span><Target size={16} /> Practical by design</span></div></section>

    <section className="section-wrap category-section" id="how-it-works">
      <div className="section-heading"><div><span className="eyebrow">A place to begin</span><h2>Learn what moves<br />you forward.</h2></div><Link className="text-link" href="/courses">Browse all courses <ArrowRight size={16} /></Link></div>
      <div className="category-grid">{categories.map(({ name, icon: Icon, note }, index) => <Link href={`/courses?category=${name}`} key={name} className={`category-tile category-${index}`}><span className="category-icon"><Icon size={22} /></span><span><strong>{name}</strong><small>{note}</small></span><ArrowUpRight className="category-arrow" size={18} /></Link>)}</div>
    </section>

    <section className="featured-section"><div className="section-wrap"><div className="section-heading"><div><span className="eyebrow">Made for your next step</span><h2>Explore a new perspective.</h2><p className="section-subtitle">Focused learning, taught by people who do the work.</p></div><Link className="text-link" href="/courses">See all courses <ArrowRight size={16} /></Link></div>
      {courses.length ? <div className="course-grid">{courses.map(course => <CourseCard key={course.id} course={course} />)}</div> : <div className="course-grid">{["Modern React & Next.js", "Practical Data Analytics", "Product Design Foundations"].map((title, i) => <div className="course-placeholder" key={title}><div className={`placeholder-image placeholder-${i}`} /><span className="eyebrow">Popular learning path</span><h3>{title}</h3><p>Explore practical skills with clear, focused lessons.</p><Link href="/courses" className="text-link">Explore courses <ArrowRight size={15} /></Link></div>)}</div>}
    </div></section>

    <section className="principles-section"><div className="section-wrap principles-wrap"><div><span className="eyebrow eyebrow-light">Learning, made human</span><h2>Progress isn&apos;t a straight line.<br /><span>It&apos;s yours to shape.</span></h2><p>We believe meaningful growth comes from curiosity, practice, and the confidence to keep going. Aster gives you the space and structure to make it happen.</p><Link href="/about" className="button button-white">Our approach <ArrowRight size={17} /></Link></div><div className="principle-list"><div><span>01</span><h3>Learn at your pace</h3><p>Short, clear lessons fit around the work and life you already have.</p></div><div><span>02</span><h3>Put ideas into practice</h3><p>Useful examples turn new concepts into skills you can actually use.</p></div><div><span>03</span><h3>Keep moving forward</h3><p>Track your progress and find your next step with confidence.</p></div></div></div></section>
    <section className="cta-section"><div><span className="eyebrow">Your next step is waiting</span><h2>Curiosity looks good on you.</h2><p>Find a course that meets you where you are—and take it from there.</p></div><Link href="/register" className="button button-large">Start learning <ArrowRight size={18} /></Link></section>
  </main>;
}
