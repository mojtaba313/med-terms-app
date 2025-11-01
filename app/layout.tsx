import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@fontsource/vazirmatn";
import { AuthProvider } from "../components/auth-provider";
import { Toaster } from "../components/ui/toaster";

export const metadata: Metadata = {
  title: "Medical Terminology App",
  description: "Learn and manage medical terms and phrases",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
