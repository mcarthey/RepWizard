import { Link, useLocation } from "wouter";
import { Home, Dumbbell, ListTree, Zap, Settings } from "lucide-react";
import { ReactNode } from "react";

type NavItem = {
  path: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { path: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { path: "/workout", label: "Workout", icon: <Dumbbell className="h-5 w-5" /> },
  { path: "/exercises", label: "Exercises", icon: <ListTree className="h-5 w-5" /> },
  { path: "/programs", label: "Programs", icon: <Zap className="h-5 w-5" /> },
  { path: "/profile", label: "Settings", icon: <Settings className="h-5 w-5" /> }
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-background border-t fixed bottom-0 inset-x-0 z-10 flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = item.path === location;
        return (
          <Link key={item.path} href={item.path}>
            <a className={`flex flex-col items-center justify-center py-1 px-3 relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-primary rounded-b-sm"></span>
              )}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
