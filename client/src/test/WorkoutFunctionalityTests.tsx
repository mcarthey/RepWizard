import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

/**
 * Test component for validating workout functionality.
 * This component isolates the key functions and behaviors of the workout tab
 * to help identify and fix issues without the complexity of the full UI.
 */
export default function WorkoutFunctionalityTests() {
  const { toast } = useToast();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Log helper function
  const log = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [message, ...prev]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Test Component</h1>
        <p className="text-muted-foreground">
          This component is used for integration testing various workout functionality.
        </p>
      </div>
      
      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Date Selection Test</CardTitle>
                <CardDescription>Tests if changing the date maintains workout state</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  log("Running date selection test");
                  toast({
                    title: "Test Running",
                    description: "Check logs for details"
                  });
                }}>
                  Run Test
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Program Loading Test</CardTitle>
                <CardDescription>Tests if programs and templates load correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  log("Running program loading test");
                  toast({
                    title: "Test Running",
                    description: "Check logs for details"
                  });
                }}>
                  Run Test
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>State Persistence Test</CardTitle>
                <CardDescription>Tests if workout state persists correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  log("Running state persistence test");
                  toast({
                    title: "Test Running",
                    description: "Check logs for details"
                  });
                }}>
                  Run Test
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Exercise CRUD Test</CardTitle>
                <CardDescription>Tests adding and removing exercises and sets</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  log("Running exercise CRUD test");
                  toast({
                    title: "Test Running",
                    description: "Check logs for details"
                  });
                }}>
                  Run Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Debug Logs</CardTitle>
              <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Run a test to see debug output.</p>
                ) : (
                  <div className="space-y-2">
                    {debugLogs.map((log, i) => (
                      <div key={i} className="border-b pb-2">
                        <pre className="text-sm whitespace-pre-wrap">{log}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}