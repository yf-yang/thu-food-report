"use client";

import EntryForm from "@/components/entry-form";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Query Report</h1>
      <EntryForm />
    </main>
  );
}
