import "@/styles/globals.css";
import "@fontsource-variable/jetbrains-mono";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unfog — Dump your thoughts. See them clearly.",
  description:
    "An AI thinking partner that turns brain fog into visual clarity maps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
