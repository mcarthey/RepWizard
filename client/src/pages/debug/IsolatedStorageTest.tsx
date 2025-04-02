import { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * A very simple, isolated test component to verify localStorage functionality
 * This component does not use any of our application hooks or state management
 * to rule out issues with those implementations
 */
export default function IsolatedStorageTest() {
  const [logs, setLogs] = useState<string[]>([]);
  
  // Add a log message to our display
  const log = (message: string) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Test basic localStorage functionality
  const testBasicStorage = () => {
    try {
      // Test setting an item
      localStorage.setItem('test-key', 'test-value');
      log('✅ Set item: test-key = test-value');
      
      // Test getting the item
      const value = localStorage.getItem('test-key');
      log(`✅ Get item: test-key = ${value}`);
      
      // Test removing the item
      localStorage.removeItem('test-key');
      log('✅ Removed item: test-key');
      
      // Verify it was removed
      const checkValue = localStorage.getItem('test-key');
      log(`✅ Verified removal: test-key ${checkValue === null ? 'is null' : '= ' + checkValue}`);
      
      // Final status
      log('✅ Basic localStorage tests completed successfully');
    } catch (error) {
      log(`❌ Error during basic tests: ${error}`);
    }
  };
  
  // Test storing arrays with programSchedules format
  const testProgramSchedulesStorage = () => {
    try {
      const testSchedules = [
        {
          id: 'test-id-1',
          programId: 1,
          startDate: '2025-04-02',
          endDate: '2025-04-30',
          selectedWeekdays: [1, 3, 5],
          active: true
        }
      ];
      
      // Directly set to localStorage
      localStorage.setItem('programSchedules', JSON.stringify(testSchedules));
      log(`✅ Set programSchedules: ${JSON.stringify(testSchedules)}`);
      
      // Get directly from localStorage
      const rawValue = localStorage.getItem('programSchedules');
      log(`✅ Raw programSchedules value: ${rawValue}`);
      
      // Parse and check
      if (rawValue) {
        const parsedValue = JSON.parse(rawValue);
        log(`✅ Parsed programSchedules: ${JSON.stringify(parsedValue)}`);
        
        // Check array structure
        if (Array.isArray(parsedValue)) {
          log(`✅ Value is an array with ${parsedValue.length} items`);
          
          // Check first item
          if (parsedValue.length > 0) {
            const firstItem = parsedValue[0];
            log(`✅ First item has id: ${firstItem.id}`);
            log(`✅ First item programId: ${firstItem.programId}`);
            log(`✅ First item selectedWeekdays: ${firstItem.selectedWeekdays.join(', ')}`);
          }
        } else {
          log('❌ Retrieved value is not an array');
        }
      } else {
        log('❌ Failed to retrieve programSchedules from localStorage');
      }
      
      // Check existence in localStorage - enumerate all keys
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allKeys.push(key);
        }
      }
      log(`✅ All localStorage keys: ${allKeys.join(', ')}`);
      
      // Final status
      log('✅ programSchedules tests completed');
    } catch (error) {
      log(`❌ Error during programSchedules tests: ${error}`);
    }
  };
  
  // Test localStorage size limits
  const testStorageLimits = () => {
    try {
      // Create a string of increasing size
      const createTestString = (sizeKB: number) => {
        // Create a 1KB chunk (approximately)
        const chunk = 'x'.repeat(1024);
        // Repeat to get desired size
        return chunk.repeat(sizeKB);
      };
      
      // Try storing 1KB
      localStorage.setItem('size-test-1kb', createTestString(1));
      log('✅ Stored 1KB successfully');
      
      // Try 10KB
      localStorage.setItem('size-test-10kb', createTestString(10));
      log('✅ Stored 10KB successfully');
      
      // Try 100KB
      localStorage.setItem('size-test-100kb', createTestString(100));
      log('✅ Stored 100KB successfully');
      
      // Clean up
      localStorage.removeItem('size-test-1kb');
      localStorage.removeItem('size-test-10kb');
      localStorage.removeItem('size-test-100kb');
      log('✅ Cleaned up size test data');
      
      // Final status
      log('✅ Storage size tests completed');
    } catch (error) {
      log(`❌ Error during storage size tests: ${error}`);
    }
  };
  
  // Clear all localStorage
  const clearAllStorage = () => {
    try {
      localStorage.clear();
      log('✅ Cleared all localStorage');
    } catch (error) {
      log(`❌ Error clearing localStorage: ${error}`);
    }
  };
  
  return (
    <>
      <Header title="Isolated localStorage Test" />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 py-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Isolated localStorage Tests</CardTitle>
              <CardDescription>
                Direct localStorage testing without any app-specific logic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={testBasicStorage} className="w-full">
                Basic localStorage Tests
              </Button>
              
              <Button onClick={testProgramSchedulesStorage} className="w-full">
                Test programSchedules Storage
              </Button>
              
              <Button onClick={testStorageLimits} className="w-full" variant="outline">
                Test Storage Size Limits
              </Button>
              
              <Button onClick={clearAllStorage} className="w-full" variant="destructive">
                Clear All localStorage
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Log of test operations and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-2 rounded max-h-96 overflow-y-auto border">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No test results yet</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={clearLogs} variant="outline" className="w-full">
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <BottomNav />
    </>
  );
}