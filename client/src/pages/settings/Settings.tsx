import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { clearAllData, exportData, importData } from "@/lib/localForage";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Theme settings
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Unit settings
  const [useMetric, setUseMetric] = useState(false);
  
  // Notification settings
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportData();
      
      // Create a blob and download it
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repwizard_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImporting(true);
      const file = event.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = e.target?.result as string;
          await importData(jsonData);
          
          toast({
            title: "Import Successful",
            description: "Your data has been imported successfully. Refresh the page to see updates.",
          });
          
          // Reset the input
          event.target.value = '';
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "The selected file contains invalid data.",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: "There was a problem importing your data.",
        variant: "destructive",
      });
    }
  };
  
  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      try {
        setIsClearing(true);
        await clearAllData();
        toast({
          title: "Data Cleared",
          description: "All your data has been cleared successfully.",
        });
        
        // Reload the page to reflect changes
        window.location.reload();
      } catch (error) {
        toast({
          title: "Operation Failed",
          description: "There was a problem clearing your data.",
          variant: "destructive",
        });
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <>
      <Header title="Settings" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-3">Appearance</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Use System Theme</div>
                    <div className="text-sm text-gray-500">Follow system dark/light mode</div>
                  </div>
                  <Switch 
                    checked={useSystemTheme} 
                    onCheckedChange={setUseSystemTheme} 
                  />
                </div>
                
                {!useSystemTheme && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Dark Mode</div>
                      <div className="text-sm text-gray-500">Use dark color theme</div>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode} 
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Units Settings */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-3">Units</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Use Metric System</div>
                  <div className="text-sm text-gray-500">Display weights in kg instead of lbs</div>
                </div>
                <Switch 
                  checked={useMetric} 
                  onCheckedChange={setUseMetric} 
                />
              </div>
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-3">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Workout Reminders</div>
                    <div className="text-sm text-gray-500">Remind me of scheduled workouts</div>
                  </div>
                  <Switch 
                    checked={workoutReminders} 
                    onCheckedChange={setWorkoutReminders} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Progress Updates</div>
                    <div className="text-sm text-gray-500">Notify me about new achievements</div>
                  </div>
                  <Switch 
                    checked={progressUpdates} 
                    onCheckedChange={setProgressUpdates} 
                  />
                </div>
              </div>
            </div>
            
            {/* Data Management */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-3">Data Management</h2>
              
              <div className="space-y-3">
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center ${
                    isExporting ? 'bg-gray-200' : 'bg-primary-50 text-primary-700'
                  }`}
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export All Data'}
                </button>
                
                <label className={`w-full py-2 px-4 rounded-lg text-center cursor-pointer block ${
                  isImporting ? 'bg-gray-200' : 'bg-primary-50 text-primary-700'
                }`}>
                  {isImporting ? 'Importing...' : 'Import Data'}
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportData}
                    disabled={isImporting}
                  />
                </label>
                
                <button 
                  className={`w-full py-2 px-4 rounded-lg text-center ${
                    isClearing ? 'bg-gray-200' : 'bg-red-50 text-red-700'
                  }`}
                  onClick={handleClearData}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Clear All Data'}
                </button>
              </div>
            </div>
            
            {/* About Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-3">About</h2>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500">VERSION</div>
                  <div>1.0.0</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">BUILT WITH</div>
                  <div>React, Tailwind CSS, Express</div>
                </div>
                
                <div className="pt-2">
                  <a 
                    href="#" 
                    className="text-primary-600 flex items-center"
                  >
                    <span className="material-icons-round text-sm mr-1">help_outline</span>
                    Help & Support
                  </a>
                </div>
                
                <div>
                  <a 
                    href="#" 
                    className="text-primary-600 flex items-center"
                  >
                    <span className="material-icons-round text-sm mr-1">privacy_tip</span>
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}
