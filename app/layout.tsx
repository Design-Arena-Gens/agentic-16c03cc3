import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shein Growth Hacker Outlier Agent",
  description: "N8n automation blueprint for detecting Shein outliers",
  metadataBase: new URL("https://agentic-16c03cc3.vercel.app")
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
