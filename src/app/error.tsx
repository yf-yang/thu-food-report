'use client'

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string },
  reset: () => void
}) {

  return (
    <div>
      出现了错误，你的学号和servicehall cookie是否正确？
      <pre>{error.message}</pre>
      <Button onClick={() => reset()}>回到首页</Button>
    </div>
  );
}