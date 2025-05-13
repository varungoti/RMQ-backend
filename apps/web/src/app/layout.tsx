import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Commented out font import
import "./globals.css";
import { GraphQLProvider } from "@/lib/apollo-provider";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// 
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "RMQ Assessment Platform",
  description: "Diagnosing student learning challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed font variables from className */}
      <body className={`antialiased`}> 
        <GraphQLProvider>{children}</GraphQLProvider> 
      </body>
    </html>
  );
}
