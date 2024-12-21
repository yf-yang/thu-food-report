"use client";

import { useEffect, ForwardedRef, forwardRef } from "react";

const CanvasPoster = forwardRef(function CanvasPoster(
  props: {
    drawCanvas: (canvas: HTMLCanvasElement) => void;
  },
  ref: ForwardedRef<HTMLCanvasElement>
) {
  const text = `2024年，真是一个值得回味的年份

  在这一年里:
  你在华子食堂花了<1032.35>元
  细细品味了<186>顿美餐
  你走进了<10>个食堂
  探寻了<32>个档口
  有哪些特别的美食味道
  让你特别认可呢？`;

  useEffect(() => {
    drawCanvas();
  }, []);

  const drawCanvas = () => {
    const canvas = (ref as React.RefObject<HTMLCanvasElement>).current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size
        canvas.width = 1000;
        canvas.height = 1000;

        // Draw background
        ctx.fillStyle = "#8A2BE2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set up text styles
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const margin = 100; // Increased left margin
        let y = 100;

        // Process each paragraph
        const paragraphs = text.split("\n");

        for (let paragraph of paragraphs) {
          paragraph = paragraph.trim();
          if (!paragraph) continue;

          let x = margin;
          let parts = paragraph.split(/(<.*?>)/);

          for (let part of parts) {
            if (part.startsWith("<") && part.endsWith(">")) {
              // Highlighted text - made larger
              ctx.font = "80px shuHeiTi";
              ctx.fillStyle = "#FFD700";
              const highlightedText = part.slice(1, -1);
              ctx.fillText(highlightedText, x, y);
              x += ctx.measureText(highlightedText).width + 5; // Added small gap
            } else {
              // Normal text
              ctx.font = "50px shuHeiTi";
              ctx.fillStyle = "white";
              ctx.fillText(part, x, y);
              x += ctx.measureText(part).width + 2; // Added small gap
            }
          }

          y += 90; // Increased space between paragraphs
        }
      }
    }
  };

  return (
    <canvas
      ref={ref}
      className="w-full h-auto border border-gray-300 rounded"
    />
  );
});

export default CanvasPoster;
