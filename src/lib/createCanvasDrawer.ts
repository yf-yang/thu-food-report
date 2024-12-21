type ReportData = Awaited<ReturnType<typeof import("@/action")["genReport"]>>;

export function createCanvasDrawer(reportData: ReportData) {}

export function basicStats(
  data: Pick<
    ReportData,
    "totalAmount" | "totalMeals" | "numUniqueCafeterias" | "numUniqueStalls"
  >
) {
  return (canvas: HTMLCanvasElement) => {
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

      const margin = 200; // Increased left margin
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
            ctx.font = 'bold 50px "Noto Sans SC", sans-serif';
            ctx.fillStyle = "#FFD700";
            const highlightedText = part.slice(1, -1);
            ctx.fillText(highlightedText, x, y);
            x += ctx.measureText(highlightedText).width + 5; // Added small gap
          } else {
            // Normal text
            ctx.font = '32px "Noto Sans SC", sans-serif';
            ctx.fillStyle = "white";
            ctx.fillText(part, x, y);
            x += ctx.measureText(part).width + 2; // Added small gap
          }
        }

        y += 70; // Increased space between paragraphs
      }
    }
  };
}
