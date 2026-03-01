import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/lib/roles";
import { HeaderActionsProvider } from "@/lib/headerActions";
import { AdminPanel } from "@/components/AdminPanel";
import { GlobalHeader } from "@/components/GlobalHeader";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hospital Command Center | HCA Healthcare",
  description: "Executive command center for hospital census and capacity visibility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body className="min-h-screen bg-bunker-950 font-sans">
        <RoleProvider>
          <HeaderActionsProvider>
            <GlobalHeader />
            {children}
          </HeaderActionsProvider>
          <AdminPanel />
        </RoleProvider>
      </body>
    </html>
  );
}
