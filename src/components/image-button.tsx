import { Button } from "./ui/button";
import path from 'path'

export default function ImageButton({
  href,
  text
}: {
  href: string;
  text: string;
}) {
  const handleSave = () => {
    const link = document.createElement("a");

    if (typeof link.download === "string") {
      link.href = href;
      link.download = path.basename(href);
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button onClick={handleSave} variant="outline" color="primary">
      {text}
    </Button>
  );
}