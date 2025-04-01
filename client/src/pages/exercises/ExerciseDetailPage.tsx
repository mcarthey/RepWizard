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
    if (!exercise?.images) return;
    setActiveImageIndex((prev) => (prev + 1) % exercise.images.length);
  };
  
  const prevImage = () => {
    if (!exercise?.images) return;
    setActiveImageIndex((prev) => (prev === 0 ? exercise.images.length - 1 : prev - 1));
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
                {exercise?.images && exercise.images.length > 0 ? (
                  <>
                    <img 
                      src={exercise.images[activeImageIndex]} 
                      alt={`${exercise.name} - view ${activeImageIndex + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/placeholder-exercise.svg';
                      }}
                    />
                    
                    {exercise.images.length > 1 && (
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
              
              {exercise?.images && exercise.images.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto py-2">
                  {exercise.images.map((image, index) => (
                    <button
                      key={index}
                      className={`h-16 w-16 rounded-md overflow-hidden border-2 ${
                        index === activeImageIndex ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img 
                        src={image} 
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
              <div className="flex flex-wrap gap-2">
                {exercise?.level && (
                  <Badge variant="outline">
                    Level: {exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
                  </Badge>
                )}
                {exercise?.equipment && (
                  <Badge variant="outline">
                    Equipment: {exercise.equipment}
                  </Badge>
                )}
                {exercise?.mechanic && (
                  <Badge variant="outline">
                    Mechanic: {exercise.mechanic}
                  </Badge>
                )}
                {exercise?.force && (
                  <Badge variant="outline">
                    Force: {exercise.force}
                  </Badge>
                )}
                {exercise?.category && (
                  <Badge variant="outline">
                    Category: {exercise.category}
                  </Badge>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Target Muscles</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise?.primaryMuscles?.map(muscle => (
                    <Badge key={muscle} variant="secondary">{muscle}</Badge>
                  ))}
                  {exercise?.secondaryMuscles?.map(muscle => (
                    <Badge key={muscle} variant="outline">{muscle}</Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">Primary: </span> 
                  {exercise?.primaryMuscles?.join(', ') || 'None'} 
                  {exercise?.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                    <>
                      <span className="font-medium ml-2">Secondary: </span>
                      {exercise.secondaryMuscles.join(', ')}
                    </>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="description">Description</TabsTrigger>
                </TabsList>
                <TabsContent value="instructions" className="mt-4 space-y-4">
                  <div className="prose max-w-none">
                    {exercise?.instructions ? (
                      exercise.instructions.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))
                    ) : (
                      <p>No instructions available for this exercise.</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="description" className="mt-4">
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <p>{exercise?.description || "No description available for this exercise."}</p>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}