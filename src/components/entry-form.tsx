import Form from "next/form";

export default function EntryForm() {
  return (
    <Form action="/report" className="space-y-4">
      <div>
        <label
          htmlFor="serviceHall"
          className="block text-sm font-medium text-gray-700"
        >
          Service Hall
        </label>
        <input
          type="text"
          id="servicehall"
          name="servicehall"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <div>
        <label htmlFor="id" className="block text-sm font-medium text-gray-700">
          ID
        </label>
        <input
          type="text"
          id="id"
          name="id"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Generate Report
      </button>
    </Form>
  );
}
