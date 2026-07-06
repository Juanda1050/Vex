import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-linear-to-b from-background via-background to-muted/35 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto mt-4 w-full max-w-6xl">{children}</div>
    </main>
  );
}
