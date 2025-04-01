import { 
  users, type User, type InsertUser,
  exercises, type Exercise, type InsertExercise,
  programs, type Program, type InsertProgram,
  workoutTemplates, type WorkoutTemplate, type InsertWorkoutTemplate,
  exerciseTemplates, type ExerciseTemplate, type InsertExerciseTemplate,
  workouts, type Workout, type InsertWorkout,
  workoutExercises, type WorkoutExercise, type InsertWorkoutExercise,
  sets, type Set, type InsertSet,
  goals, type Goal, type InsertGoal,
  programSchedules, type ProgramSchedule, type InsertProgramSchedule,
  programAssignments, type ProgramAssignment, type InsertProgramAssignment,
  type WorkoutWithDetails,
  type ExerciseWithSets,
  type LocalProgramSchedule
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { and, eq, isNull, or } from "drizzle-orm";

export interface IStorage {
  // Session store for authentication
  sessionStore: session.SessionStore;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  
  // Programs
  getPrograms(): Promise<Program[]>;
  getUserPrograms(userId: number): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<Program>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Program Assignments
  getProgramAssignments(userId: number): Promise<ProgramAssignment[]>;
  getProgramAssignment(id: number): Promise<ProgramAssignment | undefined>;
  createProgramAssignment(assignment: InsertProgramAssignment): Promise<ProgramAssignment>;
  updateProgramAssignment(id: number, assignment: Partial<ProgramAssignment>): Promise<ProgramAssignment | undefined>;
  deleteProgramAssignment(id: number): Promise<boolean>;
  
  // Program Schedules
  getProgramSchedules(userId: number): Promise<ProgramSchedule[]>;
  getProgramSchedule(id: number): Promise<ProgramSchedule | undefined>;
  createProgramSchedule(schedule: InsertProgramSchedule): Promise<ProgramSchedule>;
  updateProgramSchedule(id: number, schedule: Partial<ProgramSchedule>): Promise<ProgramSchedule | undefined>;
  deleteProgramSchedule(id: number): Promise<boolean>;
  
  // Workout Templates
  getWorkoutTemplates(programId: number): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: number): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: number, template: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | undefined>;
  deleteWorkoutTemplate(id: number): Promise<boolean>;
  
  // Exercise Templates
  getExerciseTemplates(workoutTemplateId: number): Promise<ExerciseTemplate[]>;
  getExerciseTemplate(id: number): Promise<ExerciseTemplate | undefined>;
  createExerciseTemplate(template: InsertExerciseTemplate): Promise<ExerciseTemplate>;
  updateExerciseTemplate(id: number, template: Partial<ExerciseTemplate>): Promise<ExerciseTemplate | undefined>;
  deleteExerciseTemplate(id: number): Promise<boolean>;
  
  // Workouts
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Workout Exercises
  getWorkoutExercises(workoutId: number): Promise<ExerciseWithSets[]>;
  getWorkoutExercise(id: number): Promise<WorkoutExercise | undefined>;
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  updateWorkoutExercise(id: number, workoutExercise: Partial<WorkoutExercise>): Promise<WorkoutExercise | undefined>;
  deleteWorkoutExercise(id: number): Promise<boolean>;
  
  // Sets
  getSets(workoutExerciseId: number): Promise<Set[]>;
  getSet(id: number): Promise<Set | undefined>;
  createSet(set: InsertSet): Promise<Set>;
  updateSet(id: number, set: Partial<Set>): Promise<Set | undefined>;
  deleteSet(id: number): Promise<boolean>;
  
  // Goals
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exercises: Map<number, Exercise>;
  private programs: Map<number, Program>;
  private workoutTemplates: Map<number, WorkoutTemplate>;
  private exerciseTemplates: Map<number, ExerciseTemplate>;
  private workouts: Map<number, Workout>;
  private workoutExercises: Map<number, WorkoutExercise>;
  private sets: Map<number, Set>;
  private goals: Map<number, Goal>;
  
  private currentIds: {
    users: number;
    exercises: number;
    programs: number;
    workoutTemplates: number;
    exerciseTemplates: number;
    workouts: number;
    workoutExercises: number;
    sets: number;
    goals: number;
  };

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.programs = new Map();
    this.workoutTemplates = new Map();
    this.exerciseTemplates = new Map();
    this.workouts = new Map();
    this.workoutExercises = new Map();
    this.sets = new Map();
    this.goals = new Map();
    
    this.currentIds = {
      users: 1,
      exercises: 1,
      programs: 1,
      workoutTemplates: 1,
      exerciseTemplates: 1,
      workouts: 1,
      workoutExercises: 1,
      sets: 1,
      goals: 1,
    };
    
    // Initialize with some default exercises and programs
    this.seedExercises();
    this.seedPrograms();
  }

  // Initialize with some default programs
  private seedPrograms() {
    const defaultPrograms = [
      {
        name: 'Push/Pull/Legs',
        description: 'A 3-day split focusing on pushing movements, pulling movements, and leg exercises',
        weeks: 6,
        daysPerWeek: 3,
        type: 'strength',
        difficulty: 'intermediate',
        userId: null
      },
      {
        name: 'Upper/Lower Split',
        description: 'A 4-day split alternating between upper body and lower body workouts',
        weeks: 4,
        daysPerWeek: 4,
        type: 'hypertrophy',
        difficulty: 'intermediate',
        userId: null
      },
      {
        name: 'Full Body Program',
        description: 'A beginner-friendly program working the entire body each session',
        weeks: 8,
        daysPerWeek: 3,
        type: 'strength',
        difficulty: 'beginner',
        userId: null
      }
    ] as const;

    defaultPrograms.forEach(program => {
      const id = this.currentIds.programs++;
      const newProgram: Program = { 
        id, 
        name: program.name, 
        description: program.description, 
        weeks: program.weeks,
        daysPerWeek: program.daysPerWeek,
        type: program.type,
        difficulty: program.difficulty,
        userId: program.userId 
      };
      this.programs.set(id, newProgram);
    });
  }

  // Initialize with some common exercises
  private seedExercises() {
    const defaultExercises = [
      {
        name: 'Barbell Bench Press',
        description: 'A compound chest exercise using a barbell',
        instructions: '1. Lie on a flat bench with your feet flat on the floor.\n2. Grip the barbell slightly wider than shoulder-width apart.\n3. Unrack the bar and lower it to your mid-chest.\n4. Press the bar back up to full arm extension.\n5. Keep your shoulders back and down throughout the movement.',
        muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
        videoUrl: null,
        userId: null
      },
      {
        name: 'Incline Dumbbell Press',
        description: 'An upper chest exercise using dumbbells on an incline bench',
        instructions: '1. Set an adjustable bench to a 30-45 degree incline.\n2. Sit on the bench with a dumbbell in each hand resting on your thighs.\n3. Kick the weights up one at a time and position them at shoulder level.\n4. Press the dumbbells upward until your arms are fully extended.\n5. Lower the weights back down to your shoulders in a controlled manner.',
        muscleGroups: ['Upper Chest', 'Shoulders'],
        videoUrl: null,
        userId: null
      },
      {
        name: 'Barbell Overhead Press',
        description: 'A compound shoulder exercise using a barbell',
        instructions: '1. Stand with feet shoulder-width apart and a barbell at the front rack position.\n2. Brace your core and press the barbell overhead until arms are fully extended.\n3. Lower the bar back to the front rack position under control.',
        muscleGroups: ['Shoulders', 'Triceps'],
        videoUrl: null,
        userId: null
      },
      {
        name: 'Tricep Pushdown',
        description: 'An isolation exercise for the triceps using a cable machine',
        instructions: '1. Stand facing a cable machine with a rope or straight bar attachment set at head height.\n2. Grip the attachment with hands shoulder-width apart.\n3. Keeping your upper arms stationary, extend your elbows to push the attachment down.\n4. Squeeze your triceps at the bottom and slowly return to the starting position.',
        muscleGroups: ['Triceps'],
        videoUrl: null,
        userId: null
      },
      {
        name: 'Lateral Raises',
        description: 'An isolation exercise for the side deltoids using dumbbells',
        instructions: '1. Stand with feet shoulder-width apart holding a dumbbell in each hand at your sides.\n2. Keep a slight bend in your elbows and raise the dumbbells out to the sides.\n3. Lift until your arms are parallel to the floor, then slowly lower back down.',
        muscleGroups: ['Shoulders'],
        videoUrl: null,
        userId: null
      }
    ] as const;
    
    defaultExercises.forEach(exercise => {
      const id = this.currentIds.exercises++;
      const newExercise: Exercise = {
        id,
        name: exercise.name,
        description: exercise.description,
        instructions: exercise.instructions,
        muscleGroups: [...exercise.muscleGroups],
        videoUrl: exercise.videoUrl,
        userId: exercise.userId
      };
      this.exercises.set(id, newExercise);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(
      exercise => exercise.muscleGroups?.includes(muscleGroup)
    );
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.currentIds.exercises++;
    const exercise: Exercise = { 
      id,
      name: insertExercise.name,
      description: insertExercise.description ?? null,
      instructions: insertExercise.instructions ?? null,
      muscleGroups: insertExercise.muscleGroups ?? null,
      videoUrl: insertExercise.videoUrl ?? null,
      userId: insertExercise.userId ?? null
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: number, exerciseData: Partial<Exercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    if (!exercise) return undefined;
    
    const updatedExercise = { ...exercise, ...exerciseData };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<boolean> {
    return this.exercises.delete(id);
  }

  // Program methods
  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async getProgram(id: number): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const id = this.currentIds.programs++;
    const program: Program = { 
      id,
      name: insertProgram.name,
      description: insertProgram.description ?? null,
      weeks: insertProgram.weeks ?? null,
      daysPerWeek: insertProgram.daysPerWeek ?? null,
      type: insertProgram.type ?? null,
      difficulty: insertProgram.difficulty ?? null,
      userId: insertProgram.userId ?? null
    };
    this.programs.set(id, program);
    return program;
  }

  async updateProgram(id: number, programData: Partial<Program>): Promise<Program | undefined> {
    const program = this.programs.get(id);
    if (!program) return undefined;
    
    const updatedProgram = { ...program, ...programData };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }

  // Workout Template methods
  async getWorkoutTemplates(programId: number): Promise<WorkoutTemplate[]> {
    return Array.from(this.workoutTemplates.values()).filter(
      template => template.programId === programId
    );
  }

  async getWorkoutTemplate(id: number): Promise<WorkoutTemplate | undefined> {
    return this.workoutTemplates.get(id);
  }

  async createWorkoutTemplate(insertTemplate: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const id = this.currentIds.workoutTemplates++;
    const template: WorkoutTemplate = { 
      id,
      name: insertTemplate.name,
      day: insertTemplate.day,
      week: insertTemplate.week ?? null,
      programId: insertTemplate.programId ?? null
    };
    this.workoutTemplates.set(id, template);
    return template;
  }

  // Exercise Template methods
  async getExerciseTemplates(workoutTemplateId: number): Promise<ExerciseTemplate[]> {
    return Array.from(this.exerciseTemplates.values()).filter(
      template => template.workoutTemplateId === workoutTemplateId
    );
  }

  async createExerciseTemplate(insertTemplate: InsertExerciseTemplate): Promise<ExerciseTemplate> {
    const id = this.currentIds.exerciseTemplates++;
    const template: ExerciseTemplate = { 
      id,
      order: insertTemplate.order,
      sets: insertTemplate.sets,
      reps: insertTemplate.reps,
      exerciseId: insertTemplate.exerciseId ?? null,
      workoutTemplateId: insertTemplate.workoutTemplateId ?? null,
      restTime: insertTemplate.restTime ?? null,
      targetRpe: insertTemplate.targetRpe ?? null
    };
    this.exerciseTemplates.set(id, template);
    return template;
  }

  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      workout => workout.userId === userId
    );
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const workoutExercises = await this.getWorkoutExercises(id);
    
    return {
      ...workout,
      exercises: workoutExercises
    };
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentIds.workouts++;
    const workout: Workout = { 
      id,
      date: insertWorkout.date || new Date(), // Ensure a date is always provided
      name: insertWorkout.name ?? null,
      userId: insertWorkout.userId ?? null,
      programId: insertWorkout.programId ?? null,
      notes: insertWorkout.notes ?? null,
      templateId: insertWorkout.templateId ?? null,
      completed: insertWorkout.completed ?? null
    };
    this.workouts.set(id, workout);
    return workout;
  }

  async updateWorkout(id: number, workoutData: Partial<Workout>): Promise<Workout | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;
    
    const updatedWorkout = { ...workout, ...workoutData };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    return this.workouts.delete(id);
  }

  // Workout Exercise methods
  async getWorkoutExercises(workoutId: number): Promise<ExerciseWithSets[]> {
    const workoutExercisesList = Array.from(this.workoutExercises.values()).filter(
      workoutExercise => workoutExercise.workoutId === workoutId
    );
    
    const result: ExerciseWithSets[] = [];
    
    for (const workoutExercise of workoutExercisesList) {
      // Skip if exerciseId is null
      if (workoutExercise.exerciseId === null) continue;
      
      const exercise = await this.getExercise(workoutExercise.exerciseId);
      const sets = await this.getSets(workoutExercise.id);
      
      if (exercise) {
        result.push({
          ...workoutExercise,
          exercise,
          sets
        });
      }
    }
    
    return result.sort((a, b) => a.order - b.order);
  }

  async getWorkoutExercise(id: number): Promise<WorkoutExercise | undefined> {
    return this.workoutExercises.get(id);
  }

  async createWorkoutExercise(insertWorkoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const id = this.currentIds.workoutExercises++;
    const workoutExercise: WorkoutExercise = { 
      id,
      order: insertWorkoutExercise.order,
      exerciseId: insertWorkoutExercise.exerciseId ?? null,
      workoutId: insertWorkoutExercise.workoutId ?? null
    };
    this.workoutExercises.set(id, workoutExercise);
    return workoutExercise;
  }

  // Set methods
  async getSets(workoutExerciseId: number): Promise<Set[]> {
    return Array.from(this.sets.values())
      .filter(set => set.workoutExerciseId === workoutExerciseId)
      .sort((a, b) => a.setNumber - b.setNumber);
  }

  async getSet(id: number): Promise<Set | undefined> {
    return this.sets.get(id);
  }

  async createSet(insertSet: InsertSet): Promise<Set> {
    const id = this.currentIds.sets++;
    const set: Set = { 
      id,
      reps: insertSet.reps,
      setNumber: insertSet.setNumber,
      weight: insertSet.weight,
      setType: insertSet.setType,
      notes: insertSet.notes ?? null,
      completed: insertSet.completed ?? null,
      workoutExerciseId: insertSet.workoutExerciseId ?? null,
      rpe: insertSet.rpe ?? null
    };
    this.sets.set(id, set);
    return set;
  }

  async updateSet(id: number, setData: Partial<Set>): Promise<Set | undefined> {
    const set = this.sets.get(id);
    if (!set) return undefined;
    
    const updatedSet = { ...set, ...setData };
    this.sets.set(id, updatedSet);
    return updatedSet;
  }

  async deleteSet(id: number): Promise<boolean> {
    return this.sets.delete(id);
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      goal => goal.userId === userId
    );
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentIds.goals++;
    const goal: Goal = { 
      id,
      targetWeight: insertGoal.targetWeight,
      targetReps: insertGoal.targetReps,
      userId: insertGoal.userId ?? null,
      exerciseId: insertGoal.exerciseId ?? null,
      targetRpe: insertGoal.targetRpe ?? null,
      deadline: insertGoal.deadline ?? null,
      achieved: insertGoal.achieved ?? null,
      achievedDate: insertGoal.achievedDate ?? null
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalData };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
}

// DatabaseStorage implementation for persistent storage
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Set up the PostgreSQL session store for authentication
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Exercise methods
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    // This is a basic implementation - may need refinement for array search in PostgreSQL
    return await db
      .select()
      .from(exercises)
      .where(
        exercises.muscleGroups.includes([muscleGroup])
      );
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(insertExercise).returning();
    return exercise;
  }

  async updateExercise(id: number, exerciseData: Partial<Exercise>): Promise<Exercise | undefined> {
    const [exercise] = await db
      .update(exercises)
      .set(exerciseData)
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  async deleteExercise(id: number): Promise<boolean> {
    const result = await db.delete(exercises).where(eq(exercises.id, id));
    return result.rowCount > 0;
  }

  // Program methods
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getUserPrograms(userId: number): Promise<Program[]> {
    const userAssignments = await this.getProgramAssignments(userId);
    const assignedProgramIds = userAssignments.map(assignment => assignment.programId);
    
    return await db
      .select()
      .from(programs)
      .where(
        or(
          // Include programs created by this user
          eq(programs.userId, userId),
          // Include programs assigned to this user
          programs.id.in(assignedProgramIds),
          // Include public programs (no user ID)
          isNull(programs.userId)
        )
      );
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(insertProgram).returning();
    return program;
  }

  async updateProgram(id: number, programData: Partial<Program>): Promise<Program | undefined> {
    const [program] = await db
      .update(programs)
      .set(programData)
      .where(eq(programs.id, id))
      .returning();
    return program;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id));
    return result.rowCount > 0;
  }

  // Program Assignment methods
  async getProgramAssignments(userId: number): Promise<ProgramAssignment[]> {
    return await db
      .select()
      .from(programAssignments)
      .where(eq(programAssignments.userId, userId));
  }

  async getProgramAssignment(id: number): Promise<ProgramAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(programAssignments)
      .where(eq(programAssignments.id, id));
    return assignment;
  }

  async createProgramAssignment(insertAssignment: InsertProgramAssignment): Promise<ProgramAssignment> {
    const [assignment] = await db
      .insert(programAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updateProgramAssignment(id: number, assignmentData: Partial<ProgramAssignment>): Promise<ProgramAssignment | undefined> {
    const [assignment] = await db
      .update(programAssignments)
      .set(assignmentData)
      .where(eq(programAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteProgramAssignment(id: number): Promise<boolean> {
    const result = await db
      .delete(programAssignments)
      .where(eq(programAssignments.id, id));
    return result.rowCount > 0;
  }

  // Program Schedule methods
  async getProgramSchedules(userId: number): Promise<ProgramSchedule[]> {
    return await db
      .select()
      .from(programSchedules)
      .where(eq(programSchedules.userId, userId));
  }

  async getProgramSchedule(id: number): Promise<ProgramSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(programSchedules)
      .where(eq(programSchedules.id, id));
    return schedule;
  }

  async createProgramSchedule(insertSchedule: InsertProgramSchedule): Promise<ProgramSchedule> {
    const [schedule] = await db
      .insert(programSchedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateProgramSchedule(id: number, scheduleData: Partial<ProgramSchedule>): Promise<ProgramSchedule | undefined> {
    const [schedule] = await db
      .update(programSchedules)
      .set(scheduleData)
      .where(eq(programSchedules.id, id))
      .returning();
    return schedule;
  }

  async deleteProgramSchedule(id: number): Promise<boolean> {
    const result = await db
      .delete(programSchedules)
      .where(eq(programSchedules.id, id));
    return result.rowCount > 0;
  }

  // Workout Template methods
  async getWorkoutTemplates(programId: number): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.programId, programId));
  }

  async getWorkoutTemplate(id: number): Promise<WorkoutTemplate | undefined> {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, id));
    return template;
  }

  async createWorkoutTemplate(insertTemplate: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [template] = await db
      .insert(workoutTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateWorkoutTemplate(id: number, templateData: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const [template] = await db
      .update(workoutTemplates)
      .set(templateData)
      .where(eq(workoutTemplates.id, id))
      .returning();
    return template;
  }

  async deleteWorkoutTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(workoutTemplates)
      .where(eq(workoutTemplates.id, id));
    return result.rowCount > 0;
  }

  // Exercise Template methods
  async getExerciseTemplates(workoutTemplateId: number): Promise<ExerciseTemplate[]> {
    return await db
      .select()
      .from(exerciseTemplates)
      .where(eq(exerciseTemplates.workoutTemplateId, workoutTemplateId));
  }

  async getExerciseTemplate(id: number): Promise<ExerciseTemplate | undefined> {
    const [template] = await db
      .select()
      .from(exerciseTemplates)
      .where(eq(exerciseTemplates.id, id));
    return template;
  }

  async createExerciseTemplate(insertTemplate: InsertExerciseTemplate): Promise<ExerciseTemplate> {
    const [template] = await db
      .insert(exerciseTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateExerciseTemplate(id: number, templateData: Partial<ExerciseTemplate>): Promise<ExerciseTemplate | undefined> {
    const [template] = await db
      .update(exerciseTemplates)
      .set(templateData)
      .where(eq(exerciseTemplates.id, id))
      .returning();
    return template;
  }

  async deleteExerciseTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(exerciseTemplates)
      .where(eq(exerciseTemplates.id, id));
    return result.rowCount > 0;
  }

  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));
    return workout;
  }

  async getWorkoutWithDetails(id: number): Promise<WorkoutWithDetails | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));
    
    if (!workout) return undefined;
    
    const workoutExercises = await this.getWorkoutExercises(id);
    
    return {
      ...workout,
      exercises: workoutExercises
    };
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const [workout] = await db
      .insert(workouts)
      .values(insertWorkout)
      .returning();
    return workout;
  }

  async updateWorkout(id: number, workoutData: Partial<Workout>): Promise<Workout | undefined> {
    const [workout] = await db
      .update(workouts)
      .set(workoutData)
      .where(eq(workouts.id, id))
      .returning();
    return workout;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    const result = await db
      .delete(workouts)
      .where(eq(workouts.id, id));
    return result.rowCount > 0;
  }

  // Workout Exercise methods
  async getWorkoutExercises(workoutId: number): Promise<ExerciseWithSets[]> {
    const exercises = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId));
    
    const result: ExerciseWithSets[] = [];
    
    for (const workoutExercise of exercises) {
      if (workoutExercise.exerciseId === null) continue;
      
      const exercise = await this.getExercise(workoutExercise.exerciseId);
      const sets = await this.getSets(workoutExercise.id);
      
      if (exercise) {
        result.push({
          ...workoutExercise,
          exercise,
          sets
        });
      }
    }
    
    return result;
  }

  async getWorkoutExercise(id: number): Promise<WorkoutExercise | undefined> {
    const [workoutExercise] = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.id, id));
    return workoutExercise;
  }

  async createWorkoutExercise(insertWorkoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values(insertWorkoutExercise)
      .returning();
    return workoutExercise;
  }

  async updateWorkoutExercise(id: number, workoutExerciseData: Partial<WorkoutExercise>): Promise<WorkoutExercise | undefined> {
    const [workoutExercise] = await db
      .update(workoutExercises)
      .set(workoutExerciseData)
      .where(eq(workoutExercises.id, id))
      .returning();
    return workoutExercise;
  }

  async deleteWorkoutExercise(id: number): Promise<boolean> {
    const result = await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.id, id));
    return result.rowCount > 0;
  }

  // Set methods
  async getSets(workoutExerciseId: number): Promise<Set[]> {
    return await db
      .select()
      .from(sets)
      .where(eq(sets.workoutExerciseId, workoutExerciseId));
  }

  async getSet(id: number): Promise<Set | undefined> {
    const [set] = await db
      .select()
      .from(sets)
      .where(eq(sets.id, id));
    return set;
  }

  async createSet(insertSet: InsertSet): Promise<Set> {
    const [set] = await db
      .insert(sets)
      .values(insertSet)
      .returning();
    return set;
  }

  async updateSet(id: number, setData: Partial<Set>): Promise<Set | undefined> {
    const [set] = await db
      .update(sets)
      .set(setData)
      .where(eq(sets.id, id))
      .returning();
    return set;
  }

  async deleteSet(id: number): Promise<boolean> {
    const result = await db
      .delete(sets)
      .where(eq(sets.id, id));
    return result.rowCount > 0;
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(eq(goals.id, id));
    return goal;
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db
      .insert(goals)
      .values(insertGoal)
      .returning();
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set(goalData)
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(eq(goals.id, id));
    return result.rowCount > 0;
  }
}

// Change from MemStorage to DatabaseStorage for data persistence
export const storage = new DatabaseStorage();
