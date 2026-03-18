import "@/styles/globals.css";
import "@fontsource-variable/jetbrains-mono";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Unfog — Dump your thoughts. See them clearly.",
  description:
    "An AI thinking partner that turns brain fog into visual clarity maps.",
  openGraph: {
    title: "Unfog — Dump your thoughts. See them clearly.",
    description:
      "AI turns your messy thinking into visual clarity maps. Describe, visualize, refine.",
    siteName: "Unfog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unfog — Dump your thoughts. See them clearly.",
    description:
      "AI turns your messy thinking into visual clarity maps. Describe, visualize, refine.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
