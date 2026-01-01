import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Top bar with notifications */}
      <header className="fixed top-0 right-0 left-0 lg:left-20 h-16 bg-background/80 backdrop-blur-sm border-b border-border z-30 flex items-center justify-end px-4 lg:px-8">
        <div className="flex items-center gap-4">
          {user && <NotificationDropdown />}
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.name}
          </span>
        </div>
      </header>
      
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-16",
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
