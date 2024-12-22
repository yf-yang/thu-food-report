"use client";

import { useState, useEffect, useMemo, createRef } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import { Button } from "./ui/button";
import {
  PosterBasicStats,
  PosterEarliestAndLatest,
  PosterFavorite,
  PosterFirstMeal,
  PosterHabit,
  PosterMeanCost,
  PosterMostExpensive,
  PosterMostNumStalls,
  PosterVisitedDays,
  ReportData,
} from "./poster";
import html2canvas from "html2canvas";

export default function ReportCarousel({ reportData }: { reportData: ReportData }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const refs = useMemo(
    () => Array.from({ length: 9 }).map(() => createRef<HTMLDivElement>()),
    []
  );

  useEffect(() => {
    if (!api) {
      return;
    }
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleSave = async () => {
    const element = refs[current].current;

    try {
      const canvas = await html2canvas(element!);
      const data = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      if (typeof link.download === "string") {
        link.href = data;
        link.download = `report_${current + 1}.png`;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error capturing element:", error);
    }
  };

  return (
    <>
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>
            <PosterBasicStats data={reportData} ref={refs[0]} />
          </CarouselItem>
          <CarouselItem>
            <PosterFavorite data={reportData} ref={refs[1]} />
          </CarouselItem>
          <CarouselItem>
            <PosterMeanCost data={reportData} ref={refs[2]} />
          </CarouselItem>
          <CarouselItem>
            <PosterHabit data={reportData} ref={refs[3]} />
          </CarouselItem>
          <CarouselItem>
            <PosterFirstMeal data={reportData} ref={refs[4]} />
          </CarouselItem>
          <CarouselItem>
            <PosterEarliestAndLatest data={reportData} ref={refs[5]} />
          </CarouselItem>
          <CarouselItem>
            <PosterMostExpensive data={reportData} ref={refs[6]} />
          </CarouselItem>
          <CarouselItem>
            <PosterMostNumStalls data={reportData} ref={refs[7]} />
          </CarouselItem>
          <CarouselItem>
            <PosterVisitedDays data={reportData} ref={refs[8]} />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <div className="mt-2 flex justify-between w-[240px] align-text-bottom">
        <Button onClick={handleSave}>保存图片</Button>
        <div className="py-2 text-sm text-muted-foreground">
          {current + 1} / 9
        </div>
        <Button>关于我们</Button>
      </div>
    </>
  );
}
