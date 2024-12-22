import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    h1: ({ children }) => (
      <h1 className="scroll-m-20 font-cal text-4xl">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 scroll-m-20 border-b border-b-zinc-200 pb-2 font-cal text-3xl transition-colors first:mt-0 dark:border-b-zinc-700">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 scroll-m-20 font-cal text-2xl text-stone-200">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
    ),
    a: ({ children, href }) => {
      return (
        <Link
          href={href as string}
          className="underline decoration-accent-500 decoration-2 underline-offset-4 text-blue-700"
        >
          {children}
        </Link>
      );
    },
    ul: ({ children }) => <ul className="mt-4 list-disc pl-8">{children}</ul>,
    code: ({ children }) => (
      <code className="relative rounded bg-stone-200 py-[0.2rem] px-[0.3rem] font-mono text-sm font-semibold text-zinc-900 dark:bg-stone-700 dark:text-stone-200">
        {children}
      </code>
    ),
    img: ({ src, alt }) => (
      <Image src={src ?? ""} alt={alt ?? ""} width={800} height={600} />
    ),
    ...components,
  };
}
