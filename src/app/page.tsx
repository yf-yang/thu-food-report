"use client";

import EntryForm from "@/components/entry-form";
import Instruction from "@/markdown/serviceHallInstruction.mdx";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-2">食在华子</h1>
      <h3 className="text-xl font-bold mb-2">2024华子食堂消费报告</h3>
      <EntryForm />
      <div className="text-left mt-2">
        <Instruction />
      </div>
    </main>
  );
}
