import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 一人团队 Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
