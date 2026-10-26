import { store } from "../data/store";
import type { Assessment, Course, User } from "../types/domain";

export const demoCourses = [
  ["Modern React & Next.js", "Build polished web applications with confidence.", "Development", "Intermediate", "8 hours", "photo-1633356122544-f134324a6cee"],
  ["Practical Data Analytics", "Turn business questions into clear, useful insights.", "Data", "Beginner", "6 hours", "photo-1551288049-bebda4e38f71"],
  ["Product Design Foundations", "Create thoughtful digital experiences from first principles.", "Design", "Beginner", "5 hours", "photo-1558655146-d09347e92766"],
  ["Full-stack TypeScript", "Design and deliver reliable end-to-end applications.", "Development", "Advanced", "10 hours", "photo-1498050108023-c5249f4df085"],
  ["Digital Marketing Essentials", "Build a practical, measurable marketing strategy.", "Marketing", "Beginner", "4 hours", "photo-1460925895917-afdab827c52f"],
  ["Project Management in Practice", "Lead focused teams and ship meaningful work.", "Business", "Intermediate", "7 hours", "photo-1454165804606-c3d57bc86b40"],
  ["Python for Everyday Automation", "Use Python to simplify repeatable work.", "Development", "Beginner", "6 hours", "photo-1526379095098-d400fd0bf935"],
  ["Confident Business Communication", "Make your ideas clear, concise, and compelling.", "Business", "Intermediate", "3 hours", "photo-1521737711867-e3b97375f902"]
] as const;

export function createDemoData(): { users: User[]; courses: Course[]; assessments: Assessment[] } {
  const createdAt = new Date().toISOString();
  const instructors: User[] = [
    { id: "instructor-maya", name: "Maya Chen", email: "maya@example.test", passwordHash: "", role: "instructor", bio: "Product engineer and educator.", avatar: "MC", createdAt },
    { id: "instructor-jordan", name: "Jordan Ellis", email: "jordan@example.test", passwordHash: "", role: "instructor", bio: "Data storyteller and analyst.", avatar: "JE", createdAt }
  ];
  const courses = demoCourses.map((item, index): Course => {
    const [title, subtitle, category, level, duration, image] = item;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const instructor = instructors[index % instructors.length];
    const lessons = [
      { id: `${slug}-lesson-1`, title: "Getting started", description: "Set the context and prepare your workspace.", duration: 12, type: "text" as const, content: `Welcome to ${title}. In this lesson, we'll establish the core ideas and a practical path through the course.` },
      { id: `${slug}-lesson-2`, title: "Core concepts", description: "Understand the essential tools and techniques.", duration: 18, type: "text" as const, content: "Explore the key concepts with a focused, hands-on example. Pause to reflect on how these ideas apply to your own work." },
      { id: `${slug}-lesson-3`, title: "Put it into practice", description: "Apply what you have learned to a real-world scenario.", duration: 22, type: "text" as const, content: "Bring the course ideas together in a practical exercise. Review your work and note one next step." }
    ];
    return {
      id: `course-${index + 1}`, slug, title, subtitle,
      description: `${subtitle} Learn through clear lessons, useful examples, and practical exercises designed for busy professionals.`,
      category, level: level as Course["level"], duration,
      image: `https://images.unsplash.com/${image}?auto=format&fit=crop&w=900&q=80`,
      instructorId: instructor.id, instructorName: instructor.name, status: "published",
      outcomes: ["Apply core concepts with confidence", "Build a repeatable practical workflow", "Identify meaningful next steps"],
      prerequisites: index === 0 ? ["Familiarity with JavaScript fundamentals"] : [],
      modules: [
        { id: `${slug}-module-1`, title: "Foundations", lessons: [lessons[0], lessons[1]] },
        { id: `${slug}-module-2`, title: "Application", lessons: [lessons[2]] }
      ],
      createdAt
    };
  });
  const assessments = courses.map((course): Assessment => ({
    id: `assessment-${course.id}`, courseId: course.id, title: `${course.title} knowledge check`, passingScore: 70,
    questions: [
      { id: `${course.id}-q1`, prompt: "What is the best first step when learning a new professional skill?", options: ["Practice with a clear goal", "Skip the fundamentals", "Avoid feedback"], correctIndex: 0 },
      { id: `${course.id}-q2`, prompt: "How should progress be measured?", options: ["By meaningful completed work", "By time spent online only", "By guesswork"], correctIndex: 0 }
    ]
  }));
  return { users: instructors, courses, assessments };
}

export function loadDemoData(): void {
  if (store.courses.length) return;
  const data = createDemoData();
  store.users.push(...data.users);
  store.courses.push(...data.courses);
  store.assessments.push(...data.assessments);
}
