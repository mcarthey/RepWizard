import { Link, useLocation } from "wouter";

type NavItem = {
  path: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { path: "/programs", label: "Programs", icon: "calendar_today" },
  { path: "/", label: "Workout", icon: "fitness_center" },
  { path: "/exercises", label: "Exercises", icon: "library_books" },
  { path: "/progress", label: "Progress", icon: "show_chart" },
  { path: "/settings", label: "Settings", icon: "settings" }
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-lg fixed bottom-0 inset-x-0 z-10 flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = item.path === location;
        return (
          <Link key={item.path} href={item.path}>
            <a className={`flex flex-col items-center justify-center py-1 px-3 relative ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
              <span className="material-icons-round text-base">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-primary-600 rounded-b-sm"></span>
              )}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
