import { useState, useEffect } from "react";
import Header from "@/components/navigation/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LocalStorageTest() {
  const [testKey, setTestKey] = useState("test-key");
  const [testValue, setTestValue] = useState("test-value");
  const [savedData, setSavedData] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Function to save data
  const handleSave = () => {
    try {
      localStorage.setItem(testKey, testValue);
      console.log(`Direct localStorage save: ${testKey} = ${testValue}`);
      toast({
        title: "Saved to localStorage",
        description: `Key: ${testKey}, Value: ${testValue}`,
      });
      refreshSavedData();
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      toast({
        title: "Error",
        description: `Failed to save: ${error}`,
        variant: "destructive"
      });
    }
  };
  
  // Function to load data
  const handleLoad = () => {
    try {
      const value = localStorage.getItem(testKey);
      console.log(`Direct localStorage load: ${testKey} = ${value}`);
      toast({
        title: "Loaded from localStorage",
        description: value ? `Value: ${value}` : "Key not found",
        variant: value ? "default" : "destructive"
      });
      refreshSavedData();
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      toast({
        title: "Error",
        description: `Failed to load: ${error}`,
        variant: "destructive"
      });
    }
  };
  
  // Function to clear data
  const handleClear = () => {
    try {
      localStorage.removeItem(testKey);
      console.log(`Direct localStorage removal: ${testKey}`);
      toast({
        title: "Removed from localStorage",
        description: `Key: ${testKey}`,
      });
      refreshSavedData();
    } catch (error) {
      console.error("Error removing from localStorage:", error);
      toast({
        title: "Error",
        description: `Failed to remove: ${error}`,
        variant: "destructive"
      });
    }
  };
  
  // Function to refresh the displayed saved data
  const refreshSavedData = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = value;
          }
        }
      }
      setSavedData(data);
    } catch (error) {
      console.error("Error refreshing saved data:", error);
    }
  };

  // Test specifically the programSchedules key
  const testProgramSchedules = () => {
    try {
      const testSchedule = [{ 
        id: "test-id-" + Date.now(),
        programId: 1,
        startDate: "2025-04-02",
        endDate: "2025-04-30",
        selectedWeekdays: [1, 3, 5],
        active: true
      }];
      
      // Save directly to localStorage
      localStorage.setItem("programSchedules", JSON.stringify(testSchedule));
      console.log("Test schedule saved to localStorage:", testSchedule);
      
      // Verify it was saved
      const retrieved = localStorage.getItem("programSchedules");
      console.log("Test schedule retrieved from localStorage:", retrieved);
      
      toast({
        title: "Test Schedule",
        description: retrieved ? "Saved and retrieved successfully" : "Failed to save/retrieve",
        variant: retrieved ? "default" : "destructive"
      });
      
      refreshSavedData();
    } catch (error) {
      console.error("Error in programSchedules test:", error);
      toast({
        title: "Error",
        description: `Test failed: ${error}`,
        variant: "destructive"
      });
    }
  };
  
  // On mount, refresh the saved data display
  useEffect(() => {
    refreshSavedData();
  }, []);
  
  return (
    <>
      <Header title="localStorage Test" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Test localStorage</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Key</label>
                  <Input 
                    value={testKey}
                    onChange={(e) => setTestKey(e.target.value)}
                    placeholder="Enter key"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Value</label>
                  <Input 
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1">
                  Save to localStorage
                </Button>
                <Button onClick={handleLoad} variant="outline" className="flex-1">
                  Load from localStorage
                </Button>
                <Button onClick={handleClear} variant="destructive" className="flex-1">
                  Clear Key
                </Button>
              </div>
              
              <div className="pt-2">
                <Button onClick={testProgramSchedules} className="w-full">
                  Test programSchedules Key Specifically
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Current localStorage Contents</h2>
            
            {Object.keys(savedData).length === 0 ? (
              <p className="text-gray-500 py-2">No data in localStorage</p>
            ) : (
              <div className="space-y-2">
                {Object.keys(savedData).map(key => (
                  <div key={key} className="border border-gray-200 rounded p-2">
                    <div className="font-medium text-sm">{key}</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {savedData[key]}
                    </pre>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <Button onClick={refreshSavedData} variant="outline" className="w-full">
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}