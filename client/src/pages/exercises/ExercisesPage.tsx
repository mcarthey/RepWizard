import { useState } from "react";
import { useExercises } from "@/hooks/useExercises";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, Search, Filter, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Create list of common muscle groups
const MUSCLE_GROUPS = [
  "All",
  "Abdominals",
  "Biceps",
  "Calves",
  "Chest",
  "Forearms",
  "Glutes",
  "Hamstrings",
  "Lats",
  "Lower Back",
  "Middle Back",
  "Neck",
  "Quadriceps",
  "Shoulders",
  "Traps",
  "Triceps"
];

// Filters for exercise equipment
const EQUIPMENT_FILTERS = [
  "All",
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Cable",
  "Machine",
  "Bands",
  "Body Only",
  "Medicine Ball",
  "Exercise Ball",
  "Foam Roll",
  "E-Z Curl Bar"
];

export default function ExercisesPage() {
  const { data: exercises, isLoading, error } = useExercises();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [currentView, setCurrentView] = useState("grid");

  // Filter exercises based on search term, muscle group, and equipment
  const filteredExercises = exercises?.filter(exercise => {
    const matchesSearch = searchTerm === "" || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMuscle = selectedMuscleGroup === "All" || 
      (exercise.muscleGroups && exercise.muscleGroups.some(
        muscle => muscle.toLowerCase() === selectedMuscleGroup.toLowerCase()
      )) ||
      (exercise.primaryMuscles && exercise.primaryMuscles.some(
        muscle => muscle.toLowerCase() === selectedMuscleGroup.toLowerCase()
      )) ||
      (exercise.secondaryMuscles && exercise.secondaryMuscles.some(
        muscle => muscle.toLowerCase() === selectedMuscleGroup.toLowerCase()
      ));
    
    const matchesEquipment = selectedEquipment === "All" || 
      (exercise.equipment && exercise.equipment.toLowerCase() === selectedEquipment.toLowerCase());
    
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Exercises</h1>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="h-6 w-6" />
          Exercise Library
        </h1>
        
        {/* Search and Filter */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search exercises..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Muscle Group" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map(muscle => (
                  <SelectItem key={muscle} value={muscle}>
                    {muscle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_FILTERS.map(equipment => (
                  <SelectItem key={equipment} value={equipment}>
                    {equipment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* View Selector */}
        <Tabs defaultValue="grid" className="w-full" value={currentView} onValueChange={setCurrentView}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          {/* Grid View */}
          <TabsContent value="grid" className="w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader className="p-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredExercises?.map(exercise => (
                  <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
                    <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {exercise.images && exercise.images.length > 0 ? (
                          <img 
                            src={exercise.images[0]} 
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/placeholder-exercise.svg';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <Dumbbell className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        {exercise.level && (
                          <CardDescription>
                            Level: {exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
                        {exercise.primaryMuscles?.slice(0, 2).map(muscle => (
                          <Badge key={muscle} variant="outline">{muscle}</Badge>
                        ))}
                        {exercise.equipment && (
                          <Badge variant="secondary">{exercise.equipment}</Badge>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* List View */}
          <TabsContent value="list" className="w-full">
            {isLoading ? (
              <div className="flex flex-col gap-2 mt-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-md mr-4" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-260px)] pr-4 mt-4">
                <div className="space-y-2">
                  {filteredExercises?.map(exercise => (
                    <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
                      <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 mr-4">
                          {exercise.images && exercise.images.length > 0 ? (
                            <img 
                              src={exercise.images[0]} 
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/placeholder-exercise.svg';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Dumbbell className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{exercise.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {exercise.primaryMuscles?.slice(0, 3).join(', ')}
                            {exercise.equipment && ` • ${exercise.equipment}`}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}