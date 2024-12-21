import type { Metadata } from "next";
import "./globals.css";

import localFont from "next/font/local";

const shuHeiTi = localFont({
  src: "../../public/fonts/AlimamaShuHeiTi-Bold.woff2",
  variable: "--font-shuHeiTi",
});

export const metadata: Metadata = {
  title: "华子食堂2024年度报告",
  description: "华子食堂2024年度报告",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${shuHeiTi.variable} antialiased`}>{children}</body>
    </html>
  );
}
