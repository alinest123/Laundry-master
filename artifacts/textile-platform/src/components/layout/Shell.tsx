import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
    </div>
  );
}
