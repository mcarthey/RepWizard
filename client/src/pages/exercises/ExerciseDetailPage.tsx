import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useExercise } from "@/hooks/useExercises";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Dumbbell, ChevronRight, Info } from "lucide-react";
import { Link } from "wouter";
import { Exercise } from "@shared/schema";
import { 
  getExerciseImageUrl, 
  getExerciseInstructions,
  getExerciseImageCount,
  getExerciseDescription
} from "@/lib/exerciseUtils";

export default function ExerciseDetailPage() {
  const [_, params] = useRoute("/exercises/:id");
  const exerciseId = params ? parseInt(params.id) : undefined;
  const { data: exercise, isLoading, error } = useExercise(exerciseId);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Reset image index when exercise changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [exerciseId]);
  
  // Handle image navigation
  const nextImage = () => {
    if (!exercise) return;
    const imageCount = getExerciseImageCount(exercise);
    if (imageCount === 0) return;
    setActiveImageIndex((prev) => (prev + 1) % imageCount);
  };
  
  const prevImage = () => {
    if (!exercise) return;
    const imageCount = getExerciseImageCount(exercise);
    if (imageCount === 0) return;
    setActiveImageIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Exercise</h1>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 pb-24">
      <Link href="/exercises" className="inline-flex items-center mb-4 text-primary hover:underline">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Exercises
      </Link>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="flex justify-center gap-2">
                <Skeleton className="h-16 w-16 rounded-md" />
                <Skeleton className="h-16 w-16 rounded-md" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{exercise?.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                {exercise && getExerciseImageCount(exercise) > 0 ? (
                  <>
                    <img 
                      src={getExerciseImageUrl(exercise, activeImageIndex)}
                      alt={`${exercise.name} - view ${activeImageIndex + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/placeholder-exercise.svg';
                      }}
                    />
                    
                    {getExerciseImageCount(exercise) > 1 && (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Dumbbell className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {exercise && getExerciseImageCount(exercise) > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto py-2">
                  {Array.from({ length: getExerciseImageCount(exercise) }).map((_, index) => (
                    <button
                      key={index}
                      className={`h-16 w-16 rounded-md overflow-hidden border-2 ${
                        index === activeImageIndex ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img 
                        src={getExerciseImageUrl(exercise, index)} 
                        alt={`${exercise.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/placeholder-exercise.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Exercise Information */}
            <div className="space-y-4">
              
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <Card className="p-4 bg-muted/50">
                    {exercise && exercise.description && (
                      <div className="mb-4">
                        <p>{getExerciseDescription(exercise)}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-sm">Exercise Details</h3>
                          <div className="mt-1 space-y-2">
                            {exercise?.force && (
                              <div className="text-sm"><span className="font-medium">Force Type:</span> {exercise.force}</div>
                            )}
                            {exercise?.level && (
                              <div className="text-sm"><span className="font-medium">Level:</span> {exercise.level}</div>
                            )}
                            {exercise?.mechanic && (
                              <div className="text-sm"><span className="font-medium">Mechanic:</span> {exercise.mechanic}</div>
                            )}
                            {exercise?.equipment && (
                              <div className="text-sm"><span className="font-medium">Equipment:</span> {exercise.equipment}</div>
                            )}
                            {exercise?.category && (
                              <div className="text-sm"><span className="font-medium">Category:</span> {exercise.category}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="font-medium text-sm">Primary Muscles</div>
                        <div className="flex flex-wrap gap-1">
                          {exercise?.primaryMuscles && exercise.primaryMuscles.length > 0 ? 
                            exercise.primaryMuscles.map(muscle => (
                              <Badge key={muscle} variant="secondary" className="text-xs">{muscle}</Badge>
                            )) : 
                            <span className="text-muted-foreground text-sm">None</span>
                          }
                        </div>
                      </div>
                      
                      {exercise?.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-sm">Secondary Muscles</div>
                          <div className="flex flex-wrap gap-1">
                            {exercise.secondaryMuscles.map(muscle => (
                              <Badge key={muscle} variant="outline" className="text-xs">{muscle}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
                <TabsContent value="instructions" className="mt-4 space-y-4">
                  <div className="prose max-w-none">
                    {exercise ? (
                      // Use our utility function to handle different instruction formats
                      getExerciseInstructions(exercise).length > 0 ? (
                        getExerciseInstructions(exercise).map((instruction, index) => (
                          <p key={index}>{instruction}</p>
                        ))
                      ) : (
                        <p>No instructions available for this exercise.</p>
                      )
                    ) : (
                      <p>No instructions available for this exercise.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}