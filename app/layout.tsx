import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning OS | SQL Studio",
  description: "A SQL learning workspace for practice, graduated support, and independent assessment.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
