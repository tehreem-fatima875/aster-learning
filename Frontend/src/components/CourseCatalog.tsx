"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import CourseCard from "@/components/CourseCard";
import { api, type Course } from "@/lib/api";

export default function CourseCatalog({ initialCategory }: { initialCategory: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("popular");
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { api<{ categories: string[] }>("/categories").then(result => setCategories(result.categories)).catch(() => setCategories([])); }, []);
  useEffect(() => {
    const search = new URLSearchParams({ q: query, category, level, sort });
    api<{ courses: Course[] }>(`/courses?${search}`).then(data => { setCourses(data.courses); setError(""); }).catch(() => setError("We couldn’t load courses. Check that the Aster API is running and try again."));
  }, [query, category, level, sort, retry]);
  return <main className="catalog-page"><div className="catalog-hero"><div className="catalog-hero-inner"><span className="eyebrow">The Aster collection</span><h1>Find your next<br /><span>point of progress.</span></h1><p>Thoughtful courses for curious professionals. Explore practical skills and learn at your own pace.</p><label className="catalog-search"><Search size={19} /><input aria-label="Search courses" placeholder="What would you like to learn?" value={query} onChange={event => setQuery(event.target.value)} /></label></div></div>
    <section className="section-wrap catalog-content"><div className="catalog-title-row"><div><span className="eyebrow">Explore learning</span><h2>Courses for what&apos;s next</h2></div><span className="result-count">{courses.length} courses</span></div>
      <div className="filters"><span className="filter-label"><SlidersHorizontal size={15} /> Filter by</span><select aria-label="Filter by category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{(categories.length ? categories : ["Development", "Data", "Design", "Business", "Marketing"]).map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter by level" value={level} onChange={event => setLevel(event.target.value)}><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><select className="sort-select" aria-label="Sort courses" value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Recommended</option><option value="title">Course name</option><option value="newest">Newest</option></select></div>
      {error ? <div className="empty-state"><h3>Couldn’t load courses</h3><p>{error}</p><button className="button button-outline" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : courses.length ? <div className="course-grid catalog-grid">{courses.map(course => <CourseCard key={course.id} course={course} />)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h3>No courses found</h3><p>Try a different search or clear your filters.</p><button className="button button-outline" onClick={() => { setQuery(""); setCategory(""); setLevel(""); }}>Clear filters</button></div>}
    </section></main>;
}
