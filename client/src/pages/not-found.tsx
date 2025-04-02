import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";

export default function NotFound() {
  return (
    <div className="app-height flex flex-col">
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              The page you're looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
