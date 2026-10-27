import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Ready for China",
  description:
    "Interactive pre-departure checklist for China. Answer a few quick questions and find out exactly what you still need to prepare — payment apps, internet, transport, and essential tips.",
  alternates: { canonical: "/ready" },
  openGraph: {
    title: "Get Ready for China",
    description:
      "Interactive pre-departure checklist for China. Answer a few quick questions and find out exactly what you still need to prepare.",
    type: "website",
  },
};

export default function ReadyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
