import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { Course } from "@/lib/api";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <article className="course-card">
      <Link href={`/courses/${course.slug}`} className="course-image-link" aria-label={`View ${course.title}`}>
        {/* External course art is decorative; a CSS color fallback remains if it is unavailable. */}
        <div className="course-image" style={{ backgroundImage: course.image ? `url("${course.image}")` : undefined }} />
        <span className="course-category">{course.category}</span>
      </Link>
      <div className="course-card-body">
        <div className="course-meta"><span>{course.level}</span><span className="meta-dot" /><span><Clock3 size={14} /> {course.duration}</span></div>
        <h3><Link href={`/courses/${course.slug}`}>{course.title}</Link></h3>
        <p>{course.subtitle}</p>
        <div className="course-card-bottom"><span className="instructor-mini"><span className="avatar-small">{course.instructorName.split(" ").map(part => part[0]).join("")}</span>{course.instructorName}</span><Link href={`/courses/${course.slug}`} className="arrow-link" aria-label={`Learn about ${course.title}`}><ArrowUpRight size={18} /></Link></div>
      </div>
    </article>
  );
}
