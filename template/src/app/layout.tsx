import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Workspace",
  description: "Agent-first workspace",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {/* Skip OpenUI Inspect's dev auto-mount: its hidden popover swallows Escape. */}
        <Script id="openui-no-devtools" strategy="beforeInteractive">
          {`globalThis[Symbol.for("openui.devtools.autoMount")] = true;`}
        </Script>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
