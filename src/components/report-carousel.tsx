"use client";

import { useState, useEffect, useMemo, createRef } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Button } from "./ui/button";
import CanvasPoster from "./poster";

export default function ReportCarousel({
  reportData,
}: {
  reportData: Awaited<ReturnType<typeof import("@/action")["genReport"]>>;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const refs = useMemo(
    () => Array.from({ length: 3 }).map(() => createRef<HTMLCanvasElement>()),
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

  const handleSave = () => {
    const canvas = refs[current].current;
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "chinese-poster.png";
      link.href = image;
      link.click();
    }
  };

  return (
    <>
      <Carousel setApi={setApi}>
        <CarouselContent>
          {refs.map((ref, index) => (
            <CarouselItem key={index}>
              <CanvasPoster ref={ref} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <Button onClick={handleSave}>保存图片</Button>
    </>
  );
}
