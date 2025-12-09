import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-20 lg:has-[aside:not(.collapsed)]:ml-72",
        "ml-0"
      )}>
        <div className="lg:ml-52 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
