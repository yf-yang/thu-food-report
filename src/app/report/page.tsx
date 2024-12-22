import { genReport } from "@/action";
import { ReportData } from "@/components/poster";
import ReportCarousel from "@/components/report-carousel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const serviceHall = (await searchParams).serviceHall as string;
  const id = (await searchParams).id as string;

  if (!serviceHall || !id) {
    return (
      <div>
        页面URL提供的参数错误
        <Link href="/">
          <Button>回到首页</Button>
        </Link>
      </div>
    );
  }

  let reportData: ReportData;
  try {
    reportData = await genReport(id, serviceHall);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "empty") {
        return (
          <div>
            看起来你没有任何消费记录
            <Link href="/">
              <Button>回到首页</Button>
            </Link>
          </div>
        );
      }
      return (
        <div>
          出现了错误，你的学号和servicehall cookie是否正确？
          <pre>{e.message}</pre>
          <Link href="/">
            <Button>回到首页</Button>
          </Link>
        </div>
      );
    }
    throw e;
  }
  return (
    <main className="flex flex-col items-center justify-center p-16">
      <h1 className="text-3xl font-bold mb-2">食在华子</h1>
      <h3 className="text-xl font-bold mb-2">2024华子食堂消费报告</h3>
      <ReportCarousel reportData={reportData} />
    </main>
  );
}
