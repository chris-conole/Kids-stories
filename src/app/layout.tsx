import type { Metadata } from "next";
import "./globals.css";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dreamloom";

export const metadata: Metadata = {
  title: `${APP_NAME} — A new bedtime story every night`,
  description:
    "A nightly, personalised bedtime story written just for your child. Choose their world, and we'll weave a fresh ~15-minute story every evening.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
