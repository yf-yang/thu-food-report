import { useState } from "react";
import Form from "next/form";
import { Button } from "./ui/button";

export default function EntryForm() {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = () => {
    setIsLoading(true);
  }

  return (
    <Form action="/report" className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label
          htmlFor="serviceHall"
          className="block text-sm font-medium text-gray-700"
        >
          Service Hall Cookie (参见下方的说明)
        </label>
        <input
          type="text"
          id="serviceHall"
          name="serviceHall"
          className="mt-1 block border w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <div>
        <label htmlFor="id" className="block text-sm font-medium text-gray-700">
          学号
        </label>
        <input
          type="text"
          id="id"
          name="id"
          className="mt-1 block border w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        isLoading={isLoading}
      >
        {isLoading ? "生成中..." : "生成我的专属年度报告"}
      </Button>
    </Form>
  );
}
