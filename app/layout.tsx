import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const themeScript = `(() => {
  const storageKey = "vex-theme";
  const accentKey = "vex-accent";
  const root = document.documentElement;
  const storedTheme = localStorage.getItem(storageKey);
  const isDark = storedTheme === "dark";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  const storedAccent = localStorage.getItem(accentKey);
  if (storedAccent) {
    root.setAttribute("data-accent", storedAccent);
  }
})();`;

const robotoSans = Roboto({
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vex",
  description: "Vex workspace with semantic theming and responsive shell.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${robotoSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="vex-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
