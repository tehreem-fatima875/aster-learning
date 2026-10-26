import CourseCatalog from "@/components/CourseCatalog";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  return <CourseCatalog initialCategory={params.category ?? ""} />;
}
