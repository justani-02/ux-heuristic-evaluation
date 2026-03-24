import { Link, useLocation } from "react-router-dom";
import { BarChart3, ListTodo, TrendingUp, GitCompareArrows, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Home", icon: BarChart3 },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
];

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AppNav() {
  const location = useLocation();
  const { theme, resolved, setTheme } = useTheme();

  const ActiveIcon = resolved === "dark" ? Moon : Sun;

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
          <div className="ml-2 pl-2 border-l border-border/50">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <ActiveIcon className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {themeOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer",
                      theme === opt.value && "bg-accent"
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
