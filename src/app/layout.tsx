import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "360 Render",
  description: "Private 360 panorama render studio for architects and interior designers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
