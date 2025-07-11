'use client'; // Make this a client component to use hooks

import { gql, useQuery } from '@apollo/client';
import { Button } from '@repo/ui'; // Import shared Button

// Define the GraphQL query
const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

export default function Home() {
  // Use the useQuery hook to fetch data
  const { data, loading, error } = useQuery(HELLO_QUERY);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          RMQ Assessment Platform - Web Client
        </p>
        {/* Add Login/Auth button later */}
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        {/* Placeholder Logo/Graphic Area */}
        <h1 className="text-4xl font-bold">Welcome</h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        {/* Display GraphQL query result */}
        <div className="col-span-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-semibold mb-2">Backend Status:</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">Error loading data: {error.message}</p>}
          {data && <p className="text-green-600">{data.hello}</p>}
        </div>

        {/* Example usage of shared Button */}
        <div className="col-span-4 mt-8 flex justify-center gap-4">
          <Button variant="primary" onClick={() => alert('Primary Clicked!')}>Primary Button</Button>
          <Button variant="secondary" onClick={() => alert('Secondary Clicked!')}>Secondary Button</Button>
          <Button variant="destructive" onClick={() => alert('Destructive Clicked!')}>Destructive Button</Button>
        </div>
      </div>
    </main>
  );
}
