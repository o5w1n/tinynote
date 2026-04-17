import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TinyNote",
  description: "A simple note-taking app with rich text editing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
