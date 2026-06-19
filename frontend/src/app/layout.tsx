import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TermSheet Analyzer - Process and Validate Term Sheets",
  description: "Upload, extract, and validate term sheet data using AI technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="text-black">
        {children}
      </body>
    </html>
  );
}
