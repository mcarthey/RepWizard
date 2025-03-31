import { pgTable, text, serial, integer, jsonb, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Exercise table
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  muscleGroups: text("muscle_groups").array(),
  videoUrl: text("video_url"),
  userId: integer("user_id").references(() => users.id),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Program table
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  weeks: integer("weeks").default(4),
  daysPerWeek: integer("days_per_week").default(3),
  type: text("type").default("strength"), // e.g., strength, hypertrophy, endurance
  difficulty: text("difficulty").default("intermediate"), // e.g., beginner, intermediate, advanced
  userId: integer("user_id").references(() => users.id),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

// WorkoutTemplate table
export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  day: integer("day").notNull(),
  week: integer("week").default(1),
  programId: integer("program_id").references(() => programs.id),
});

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates).omit({
  id: true,
});

export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;

// ExerciseTemplate table
export const exerciseTemplates = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  workoutTemplateId: integer("workout_template_id").references(() => workoutTemplates.id),
  order: integer("order").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // Stored as text to handle ranges like "8-12"
  restTime: integer("rest_time"), // Time in seconds
  targetRpe: real("target_rpe"),
});

export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates).omit({
  id: true,
});

export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;
export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;

// Workout table
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  name: text("name"),
  notes: text("notes"),
  programId: integer("program_id").references(() => programs.id),
  templateId: integer("template_id").references(() => workoutTemplates.id),
  completed: boolean("completed").default(false),
  userId: integer("user_id").references(() => users.id),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

// WorkoutExercise table
export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  order: integer("order").notNull(),
});

export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({
  id: true,
});

export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;

// SetType enum for set types like warm-up, working, drop set
export const SetTypeEnum = z.enum(['warmup', 'working', 'dropset', 'failure', 'backoff']);
export type SetType = z.infer<typeof SetTypeEnum>;

// Set table
export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  workoutExerciseId: integer("workout_exercise_id").references(() => workoutExercises.id),
  setNumber: integer("set_number").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  rpe: real("rpe"),
  setType: text("set_type").notNull(), // One of the SetType values
  completed: boolean("completed").default(false),
  notes: text("notes"),
});

export const insertSetSchema = createInsertSchema(sets).omit({
  id: true,
});

export type InsertSet = z.infer<typeof insertSetSchema>;
export type Set = typeof sets.$inferSelect;

// Goal table for tracking user goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  targetWeight: real("target_weight").notNull(),
  targetReps: integer("target_reps").notNull(),
  targetRpe: real("target_rpe"),
  deadline: timestamp("deadline"),
  achieved: boolean("achieved").default(false),
  achievedDate: timestamp("achieved_date"),
  userId: integer("user_id").references(() => users.id),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Expanded workout types for frontend consumption
export type WorkoutWithDetails = Workout & {
  exercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: Set[];
  })[];
};

export type ExerciseWithSets = WorkoutExercise & {
  exercise: Exercise;
  sets: Set[];
};

// For frontend storage in localStorage
export type LocalWorkout = {
  id: string;
  date: string;
  name: string | null;
  notes: string | null;
  programId: number | null;
  templateId: number | null;
  completed: boolean;
  exercises: LocalExercise[];
};

export type LocalExercise = {
  id: string;
  workoutId: string;
  exerciseId: number;
  exercise: {
    id: number;
    name: string;
    muscleGroups: string[];
  };
  order: number;
  sets: LocalSet[];
};

export type LocalSet = {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: string;
  completed: boolean;
  notes: string | null;
};
