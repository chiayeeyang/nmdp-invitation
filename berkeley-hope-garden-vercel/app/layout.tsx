import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Your flower is missing · Berkeley Hope Garden",
  description:
    "Plant a little hope. Join us for the NMDP tabling session on September 21, 10 AM–12 PM, outside Amazon Hub Locker on Bancroft.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
