import { genReport } from "@/action";
import ReportCarousel from "@/components/report-carousel";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const servicehall = (await searchParams).servicehall as string;
  const id = (await searchParams).id as string;

  if (!servicehall || !id) {
    return <div>Missing required parameters</div>;
  }

  const reportData = await genReport();

  return (
    <main className="flex flex-col items-center justify-center p-16">
      <h1 className="text-4xl font-bold mb-8">Report</h1>
      <ReportCarousel reportData={reportData} />
    </main>
  );
}
