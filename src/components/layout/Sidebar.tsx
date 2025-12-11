import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  HeartPulse,
  Menu,
  X,
  Layers,
  LogOut,
  User
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  // Filter nav items based on role
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ['admin', 'patient', 'physician'] },
    { to: "/appointments", icon: Calendar, label: "Appointments", roles: ['admin', 'patient', 'physician'] },
    { to: "/specializations", icon: Layers, label: "Specializations", roles: ['admin', 'patient', 'physician'] },
    { to: "/physicians", icon: Stethoscope, label: "Physicians", roles: ['admin'] },
    { to: "/patients", icon: Users, label: "Patients", roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 ease-out flex flex-col",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-72"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <HeartPulse className="w-6 h-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-xl text-sidebar-foreground animate-fade-in">
                HomeCare
              </span>
            )}
          </div>
        </div>

        {/* User info */}
        {user && !collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group",
                collapsed && "justify-center px-3"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="px-3 pb-4">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-14 border-t border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Menu className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(false)}
        className={cn(
          "fixed top-4 left-4 z-30 lg:hidden p-3 rounded-xl bg-card shadow-card border border-border",
          !collapsed && "opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Close button for mobile */}
      <button
        onClick={() => setCollapsed(true)}
        className={cn(
          "fixed top-4 right-4 z-50 lg:hidden p-3 rounded-xl bg-card shadow-card border border-border transition-opacity",
          collapsed && "opacity-0 pointer-events-none"
        )}
      >
        <X className="w-5 h-5" />
      </button>
    </>
  );
}
