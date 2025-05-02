import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-secondary">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-primary">Welcome to AuthFlow</h1>
        <p className="text-lg mb-8 text-foreground/80">
          Register now to get started.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </main>
  );
}
