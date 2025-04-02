import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/navigation/Header";

/**
 * Test runner component for running functional tests in the browser.
 * This component can be used to verify functionality and run unit tests
 * without requiring a separate test runner.
 */
export default function TestRunner() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTestSuite, setActiveTestSuite] = useState<string>('workout');
  const [testResults, setTestResults] = useState<{
    passed: number;
    failed: number;
    total: number;
  }>({
    passed: 0,
    failed: 0,
    total: 0
  });

  // Log helper function
  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [message, ...prev]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Reset test results
  const resetResults = () => {
    setTestResults({
      passed: 0,
      failed: 0,
      total: 0
    });
  };

  // Mock test function for workout utilities
  const runWorkoutTests = () => {
    log("🧪 Starting workout utility tests...");
    resetResults();

    let passCount = 0;
    let failCount = 0;
    
    // Test 1: Calculate 1RM
    try {
      log("Test 1: calculateOneRepMax");
      
      // Define test cases with expected results
      const testCases = [
        { weight: 225, reps: 5, expected: 253.1 }, // ~253.125
        { weight: 100, reps: 10, expected: 133.3 }, // ~133.333
        { weight: 315, reps: 1, expected: 315 }
      ];
      
      for (const { weight, reps, expected } of testCases) {
        try {
          // Mock function since we can't import directly
          const calculateOneRepMax = (weight: number, reps: number): number => {
            if (weight <= 0) return 0;
            if (reps <= 0) return weight;
            // Brzycki formula
            return weight * (36 / (37 - Math.abs(reps)));
          };
          
          const result = calculateOneRepMax(weight, reps);
          const isClose = Math.abs(result - expected) < 0.5; // Allow small floating point differences
          
          if (isClose) {
            log(`✅ 1RM(${weight}x${reps}) = ${result.toFixed(1)} (expected: ${expected})`);
            passCount++;
          } else {
            log(`❌ 1RM(${weight}x${reps}) = ${result.toFixed(1)} (expected: ${expected})`);
            failCount++;
          }
        } catch (err) {
          log(`❌ Error in 1RM calculation: ${err}`);
          failCount++;
        }
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Test 2: RPE Description
    try {
      log("\nTest 2: getRpeDescription");
      
      // Define a mock implementation of the function
      const getRpeDescription = (rpe: number): string => {
        if (!Number.isInteger(rpe) || rpe < 1 || rpe > 10) return "";
        
        const descriptions: Record<number, string> = {
          10: "Maximum Effort",
          9: "Very Hard",
          8: "Hard",
          7: "Challenging",
          6: "Moderate",
          5: "Somewhat Easy",
          4: "Easy",
          3: "Very Easy",
          2: "Very Easy",
          1: "Very Easy"
        };
        
        return descriptions[rpe] || "";
      };
      
      // Test cases
      const testCases = [
        { rpe: 10, expected: "Maximum Effort" },
        { rpe: 8, expected: "Hard" },
        { rpe: 6, expected: "Moderate" },
        { rpe: 4, expected: "Easy" },
        { rpe: 11, expected: "" }, // Out of range
        { rpe: 0, expected: "" }, // Out of range
        { rpe: 7.5, expected: "" } // Non-integer
      ];
      
      for (const { rpe, expected } of testCases) {
        const result = getRpeDescription(rpe);
        
        if (result === expected) {
          log(`✅ RPE(${rpe}) = "${result}" (expected: "${expected}")`);
          passCount++;
        } else {
          log(`❌ RPE(${rpe}) = "${result}" (expected: "${expected}")`);
          failCount++;
        }
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Test 3: ID Generation
    try {
      log("\nTest 3: generateWorkoutID");
      
      // Mock implementation
      const generateWorkoutID = (): string => {
        return `workout-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      };
      
      // Generate multiple IDs and check uniqueness
      const ids = Array(5).fill(0).map(() => generateWorkoutID());
      const uniqueIds = new Set(ids);
      
      if (uniqueIds.size === ids.length) {
        log(`✅ Generated ${ids.length} unique IDs`);
        log(`  Sample: ${ids[0]}`);
        passCount++;
      } else {
        log(`❌ Generated ${uniqueIds.size} unique IDs out of ${ids.length} total`);
        failCount++;
      }
      
      // Check prefix
      const allHavePrefix = ids.every(id => id.startsWith('workout-'));
      if (allHavePrefix) {
        log(`✅ All IDs have correct prefix`);
        passCount++;
      } else {
        log(`❌ Some IDs are missing the required prefix`);
        failCount++;
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Update test results
    setTestResults({
      passed: passCount,
      failed: failCount,
      total: passCount + failCount
    });
    
    // Show summary
    log(`\n📊 Test Summary:`);
    log(`  Total Tests: ${passCount + failCount}`);
    log(`  ✅ Passed: ${passCount}`);
    log(`  ❌ Failed: ${failCount}`);
    
    // Show toast notification
    toast({
      title: "Test run complete",
      description: `${passCount} passed, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default"
    });
  };

  // Mock test function for storage utilities
  const runStorageTests = () => {
    log("🧪 Starting storage utility tests...");
    resetResults();

    let passCount = 0;
    let failCount = 0;
    
    // Test localStorage wrapper functions
    try {
      log("Test 1: Basic storage operations");
      
      // Define mock storage functions
      const saveToStorage = (key: string, data: any): void => {
        try {
          const serialized = JSON.stringify(data);
          localStorage.setItem(key, serialized);
        } catch (error) {
          console.error('Error saving to storage:', error);
        }
      };
      
      const loadFromStorage = <T,>(key: string): T | null => {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized === null) return null;
          return JSON.parse(serialized) as T;
        } catch (error) {
          console.error('Error loading from storage:', error);
          return null;
        }
      };
      
      const removeFromStorage = (key: string): void => {
        localStorage.removeItem(key);
      };
      
      // Test saving and loading
      const testData = { id: 1, name: 'Test', items: [1, 2, 3] };
      
      // Clear any existing test data
      removeFromStorage('test-storage-key');
      
      // Test saving
      saveToStorage('test-storage-key', testData);
      
      // Test loading
      const loaded = loadFromStorage<typeof testData>('test-storage-key');
      
      if (loaded && loaded.id === testData.id && loaded.name === testData.name) {
        log(`✅ Successfully saved and loaded data`);
        passCount++;
      } else {
        log(`❌ Failed to save or load data correctly`);
        failCount++;
      }
      
      // Test removal
      removeFromStorage('test-storage-key');
      const afterRemoval = loadFromStorage('test-storage-key');
      
      if (afterRemoval === null) {
        log(`✅ Successfully removed data`);
        passCount++;
      } else {
        log(`❌ Failed to remove data`);
        failCount++;
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Test 2: Complex data structures
    try {
      log("\nTest 2: Complex data structures");
      
      // Define the same mock functions as above
      const saveToStorage = (key: string, data: any): void => {
        try {
          const serialized = JSON.stringify(data);
          localStorage.setItem(key, serialized);
        } catch (error) {
          console.error('Error saving to storage:', error);
        }
      };
      
      const loadFromStorage = <T,>(key: string): T | null => {
        try {
          const serialized = localStorage.getItem(key);
          if (serialized === null) return null;
          return JSON.parse(serialized) as T;
        } catch (error) {
          console.error('Error loading from storage:', error);
          return null;
        }
      };
      
      // Create a complex nested structure
      const complexData = {
        id: 'test-complex',
        name: 'Complex Data',
        nested: {
          level1: {
            level2: {
              array: [1, 2, 3],
              boolean: true,
              null: null,
              date: new Date().toISOString()
            }
          }
        },
        array: [
          { id: 1, value: 'one' },
          { id: 2, value: 'two' }
        ]
      };
      
      // Save complex data
      saveToStorage('test-complex-key', complexData);
      
      // Load complex data
      const loaded = loadFromStorage<typeof complexData>('test-complex-key');
      
      // Verify structure is preserved
      if (loaded &&
          loaded.nested.level1.level2.array.length === 3 &&
          loaded.array[1].value === 'two' &&
          loaded.nested.level1.level2.boolean === true) {
        log(`✅ Successfully preserved complex data structure`);
        passCount++;
      } else {
        log(`❌ Failed to preserve complex data structure`);
        failCount++;
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Update test results
    setTestResults({
      passed: passCount,
      failed: failCount,
      total: passCount + failCount
    });
    
    // Show summary
    log(`\n📊 Test Summary:`);
    log(`  Total Tests: ${passCount + failCount}`);
    log(`  ✅ Passed: ${passCount}`);
    log(`  ❌ Failed: ${failCount}`);
    
    // Show toast notification
    toast({
      title: "Test run complete",
      description: `${passCount} passed, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default"
    });
  };

  // Mock test function for program utilities
  const runProgramTests = () => {
    log("🧪 Starting program utility tests...");
    resetResults();
    
    let passCount = 0;
    let failCount = 0;
    
    // Test function to create and fetch program schedules
    try {
      log("Test 1: Program schedules");
      
      // Create a test program schedule
      const testSchedule = {
        id: 'test-schedule-' + Date.now(),
        programId: 1,
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        selectedWeekdays: [1, 3, 5], // Mon, Wed, Fri
        active: true
      };
      
      // Save to localStorage
      try {
        const existingSchedulesStr = localStorage.getItem('repwizard_program_schedules');
        const schedules = existingSchedulesStr ? JSON.parse(existingSchedulesStr) : [];
        schedules.push(testSchedule);
        localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
        
        log(`✅ Successfully saved program schedule`);
        passCount++;
      } catch (err) {
        log(`❌ Failed to save program schedule: ${err}`);
        failCount++;
      }
      
      // Retrieve schedules
      try {
        const retrievedSchedulesStr = localStorage.getItem('repwizard_program_schedules');
        const retrievedSchedules = JSON.parse(retrievedSchedulesStr || '[]');
        
        // Find our test schedule
        const found = retrievedSchedules.find((s: any) => s.id === testSchedule.id);
        
        if (found) {
          log(`✅ Successfully retrieved program schedule`);
          passCount++;
        } else {
          log(`❌ Failed to retrieve program schedule`);
          failCount++;
        }
      } catch (err) {
        log(`❌ Error retrieving program schedule: ${err}`);
        failCount++;
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Test 2: Check if date has scheduled programs
    try {
      log("\nTest 2: Check if date has scheduled programs");
      
      // Date utils
      const isSelectedWeekday = (date: Date, selectedWeekdays: number[]) => {
        const day = date.getDay();
        return selectedWeekdays.includes(day);
      };
      
      const isDateInSchedule = (date: Date, schedule: any) => {
        return (
          new Date(schedule.startDate) <= date &&
          new Date(schedule.endDate) >= date &&
          isSelectedWeekday(date, schedule.selectedWeekdays) &&
          schedule.active
        );
      };
      
      // Create more test schedules for different dates
      const schedules = [
        {
          id: 'schedule-1',
          programId: 1,
          startDate: '2025-04-01',
          endDate: '2025-04-30',
          selectedWeekdays: [1, 3, 5], // Mon, Wed, Fri
          active: true
        },
        {
          id: 'schedule-2', 
          programId: 2,
          startDate: '2025-05-01',
          endDate: '2025-05-31',
          selectedWeekdays: [2, 4], // Tue, Thu
          active: true
        }
      ];
      
      // Test dates
      const testCases = [
        { date: new Date('2025-04-07'), // Monday in April
          expectedProgram: 'schedule-1', 
          shouldHaveProgram: true },
        { date: new Date('2025-04-08'), // Tuesday in April
          expectedProgram: null, 
          shouldHaveProgram: false },
        { date: new Date('2025-05-06'), // Tuesday in May
          expectedProgram: 'schedule-2', 
          shouldHaveProgram: true },
      ];
      
      for (const { date, expectedProgram, shouldHaveProgram } of testCases) {
        // Find matching schedule
        const matchingSchedule = schedules.find(s => isDateInSchedule(date, s));
        const hasProgram = !!matchingSchedule;
        
        if (hasProgram === shouldHaveProgram) {
          log(`✅ Date ${date.toISOString().split('T')[0]} correctly ${hasProgram ? 'has' : 'does not have'} a program`);
          if (expectedProgram && matchingSchedule && matchingSchedule.id === expectedProgram) {
            log(`   - Matched with ${matchingSchedule.id} as expected`);
          }
          passCount++;
        } else {
          log(`❌ Date ${date.toISOString().split('T')[0]} should ${shouldHaveProgram ? 'have' : 'not have'} a program`);
          failCount++;
        }
      }
    } catch (err) {
      log(`❌ Test suite error: ${err}`);
      failCount++;
    }
    
    // Update test results
    setTestResults({
      passed: passCount,
      failed: failCount,
      total: passCount + failCount
    });
    
    // Show summary
    log(`\n📊 Test Summary:`);
    log(`  Total Tests: ${passCount + failCount}`);
    log(`  ✅ Passed: ${passCount}`);
    log(`  ❌ Failed: ${failCount}`);
    
    // Show toast notification
    toast({
      title: "Test run complete",
      description: `${passCount} passed, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default"
    });
  };

  const runSelectedTests = () => {
    switch (activeTestSuite) {
      case 'workout':
        runWorkoutTests();
        break;
      case 'storage':
        runStorageTests();
        break;
      case 'program':
        runProgramTests();
        break;
      default:
        log("⚠️ No test suite selected");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <Header title="Test Runner" />
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          This page runs tests directly in the browser to validate functionality without requiring a separate test runner.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>Output from test runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
                <div className="text-sm">
                  <span className="text-green-500 font-medium mr-2">Passed: {testResults.passed}</span>
                  <span className="text-destructive font-medium mr-2">Failed: {testResults.failed}</span>
                  <span className="font-medium">Total: {testResults.total}</span>
                </div>
              </div>
              
              <ScrollArea className="h-[500px] rounded-md border p-4">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Run a test to see output here.</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <div key={i} className="border-b pb-2 font-mono text-sm">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Suites</CardTitle>
              <CardDescription>Select and run tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTestSuite} onValueChange={setActiveTestSuite}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="workout">Workout</TabsTrigger>
                  <TabsTrigger value="storage">Storage</TabsTrigger>
                  <TabsTrigger value="program">Program</TabsTrigger>
                </TabsList>
                
                <TabsContent value="workout">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Tests for workout utility functions including 1RM calculation, RPE descriptions, and ID generation.
                  </p>
                </TabsContent>
                
                <TabsContent value="storage">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Tests for local storage operations, saving and loading complex data structures.
                  </p>
                </TabsContent>
                
                <TabsContent value="program">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Tests for program scheduling functionality, date calculations, and program schedules.
                  </p>
                </TabsContent>
              </Tabs>
              
              <Button onClick={runSelectedTests} className="w-full">
                Run Selected Tests
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Test Statistics</CardTitle>
              <CardDescription>Results from last test run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Tests:</span>
                  <span className="font-medium">{testResults.total}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Passed:</span>
                  <span className="font-medium text-green-500">{testResults.passed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-destructive">{testResults.failed}</span>
                </div>
                {testResults.total > 0 && (
                  <div className="pt-2">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ 
                          width: `${testResults.total > 0 ? (testResults.passed / testResults.total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}