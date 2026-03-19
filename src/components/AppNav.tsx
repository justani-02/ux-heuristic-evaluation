import { Link, useLocation } from "react-router-dom";
import { BarChart3, LayoutDashboard, ListTodo, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", icon: BarChart3 },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/trends", label: "Trends", icon: TrendingUp },
];

export function AppNav() {
  const location = useLocation();

  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 print:hidden">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Evaluator
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
