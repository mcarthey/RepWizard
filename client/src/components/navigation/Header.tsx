import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actionButton?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Header({ 
  title, 
  showBackButton = false, 
  onBackClick,
  actionButton,
  children
}: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      setLocation('/');
    }
  };

  return (
    <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        {showBackButton && (
          <button 
            className="mr-2" 
            onClick={handleBackClick}
            aria-label="Go back"
          >
            <span className="material-icons-round text-gray-600">arrow_back</span>
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      
      <div className="flex items-center">
        {children}
        {actionButton || (
          <button 
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Options"
          >
            <span className="material-icons-round text-gray-600">more_vert</span>
          </button>
        )}
      </div>
    </header>
  );
}
