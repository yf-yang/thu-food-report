import { genReport } from "@/action";
import ReportCarousel from "@/components/report-carousel";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const serviceHall = (await searchParams).serviceHall as string;
  const id = (await searchParams).id as string;

  if (!serviceHall || !id) {
    return <div>Missing required parameters</div>;
  }

  const reportData = await genReport(id, serviceHall);

  return (
    <main className="flex flex-col items-center justify-center p-16">
      <h1 className="text-4xl font-bold mb-8">Report</h1>
      <ReportCarousel reportData={reportData} />
    </main>
  );
}
