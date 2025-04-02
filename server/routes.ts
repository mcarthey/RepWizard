import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  insertExerciseSchema,
  insertProgramSchema,
  insertWorkoutTemplateSchema,
  insertExerciseTemplateSchema,
  insertWorkoutSchema,
  insertWorkoutExerciseSchema,
  insertSetSchema,
  insertGoalSchema,
  insertProgramAssignmentSchema,
  insertProgramScheduleSchema,
  SetTypeEnum,
  UserRoleEnum
} from "@shared/schema";

// Auth middleware
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized - Please login" });
};

// Role-based middleware
const ensureRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized - Please login" });
    }
    
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Set up static file serving for exercise images
  const assetsPath = path.join(__dirname, 'client', 'public', 'assets');
  app.use('/assets', express.static(assetsPath));
  console.log(`Serving static assets from: ${assetsPath}`);
  
  // Error handling helper
  const handleError = (err: unknown) => {
    if (err instanceof ZodError) {
      return { status: 400, message: err.errors };
    }
    return { status: 500, message: 'Internal server error' };
  };

  // Exercise routes - Available to all authenticated users
  app.get('/api/exercises', ensureAuthenticated, async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/exercises/:id', async (req, res) => {
    try {
      const exercise = await storage.getExercise(Number(req.params.id));
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      res.json(exercise);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/exercises/muscle/:group', async (req, res) => {
    try {
      const exercises = await storage.getExercisesByMuscleGroup(req.params.group);
      res.json(exercises);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/exercises', async (req, res) => {
    try {
      const exerciseData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(exerciseData);
      res.status(201).json(exercise);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/exercises/:id', async (req, res) => {
    try {
      const exercise = await storage.updateExercise(
        Number(req.params.id),
        req.body
      );
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      res.json(exercise);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/exercises/:id', async (req, res) => {
    try {
      const success = await storage.deleteExercise(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Program routes
  app.get('/api/programs', async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/programs/:id', async (req, res) => {
    try {
      const program = await storage.getProgram(Number(req.params.id));
      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.json(program);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/programs', async (req, res) => {
    try {
      const programData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/programs/:id', async (req, res) => {
    try {
      const program = await storage.updateProgram(
        Number(req.params.id),
        req.body
      );
      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.json(program);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/programs/:id', async (req, res) => {
    try {
      const success = await storage.deleteProgram(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Workout Template routes
  app.get('/api/programs/:programId/templates', async (req, res) => {
    try {
      const programId = Number(req.params.programId);
      if (isNaN(programId)) {
        return res.status(400).json({ error: 'Invalid program ID' });
      }
      
      const templates = await storage.getWorkoutTemplates(programId);
      res.json(templates);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/workout-templates/:id', async (req, res) => {
    try {
      const template = await storage.getWorkoutTemplate(Number(req.params.id));
      if (!template) {
        return res.status(404).json({ error: 'Workout template not found' });
      }
      res.json(template);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/workout-templates', async (req, res) => {
    try {
      const templateData = insertWorkoutTemplateSchema.parse(req.body);
      const template = await storage.createWorkoutTemplate(templateData);
      res.status(201).json(template);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Exercise Template routes
  app.get('/api/workout-templates/:templateId/exercises', async (req, res) => {
    try {
      const exercises = await storage.getExerciseTemplates(Number(req.params.templateId));
      res.json(exercises);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/exercise-templates', async (req, res) => {
    try {
      const templateData = insertExerciseTemplateSchema.parse(req.body);
      const template = await storage.createExerciseTemplate(templateData);
      res.status(201).json(template);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Workout routes
  app.get('/api/workouts', async (req, res) => {
    try {
      // In a real app, this would get userId from session
      const userId = Number(req.query.userId) || 1;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/workouts/:id', async (req, res) => {
    try {
      const workout = await storage.getWorkoutWithDetails(Number(req.params.id));
      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      res.json(workout);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/workouts', async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/workouts/:id', async (req, res) => {
    try {
      const workout = await storage.updateWorkout(
        Number(req.params.id),
        req.body
      );
      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      res.json(workout);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Workout Exercise routes
  app.get('/api/workouts/:workoutId/exercises', async (req, res) => {
    try {
      const exercises = await storage.getWorkoutExercises(Number(req.params.workoutId));
      res.json(exercises);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/workout-exercises', async (req, res) => {
    try {
      const exerciseData = insertWorkoutExerciseSchema.parse(req.body);
      const exercise = await storage.createWorkoutExercise(exerciseData);
      res.status(201).json(exercise);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Set routes
  app.get('/api/workout-exercises/:exerciseId/sets', async (req, res) => {
    try {
      const sets = await storage.getSets(Number(req.params.exerciseId));
      res.json(sets);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/sets', async (req, res) => {
    try {
      const body = { ...req.body };
      
      // Validate set type
      if (body.setType) {
        SetTypeEnum.parse(body.setType);
      }
      
      const setData = insertSetSchema.parse(body);
      const set = await storage.createSet(setData);
      res.status(201).json(set);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/sets/:id', async (req, res) => {
    try {
      // Validate set type if present
      if (req.body.setType) {
        SetTypeEnum.parse(req.body.setType);
      }
      
      const set = await storage.updateSet(
        Number(req.params.id),
        req.body
      );
      if (!set) {
        return res.status(404).json({ error: 'Set not found' });
      }
      res.json(set);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/sets/:id', async (req, res) => {
    try {
      const success = await storage.deleteSet(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Set not found' });
      }
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Goal routes
  app.get('/api/goals', async (req, res) => {
    try {
      // In a real app, this would get userId from session
      const userId = Number(req.query.userId) || 1;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/goals', async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/goals/:id', async (req, res) => {
    try {
      const goal = await storage.updateGoal(
        Number(req.params.id),
        req.body
      );
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      res.json(goal);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/goals/:id', async (req, res) => {
    try {
      const success = await storage.deleteGoal(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Program Assignment routes - Role-based access control
  app.get('/api/program-assignments', ensureAuthenticated, async (req, res) => {
    try {
      // Use logged-in user's ID or provided ID for admin/trainer
      let userId = (req.user as any).id;
      
      // If admin or trainer and a specific userId is provided, use that instead
      if ((req.user as any).role === 'admin' || (req.user as any).role === 'trainer') {
        if (req.query.userId) {
          userId = Number(req.query.userId);
        }
      }
      
      const assignments = await storage.getProgramAssignments(userId);
      res.json(assignments);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/program-assignments', ensureRole(['admin', 'trainer']), async (req, res) => {
    try {
      const assignmentData = insertProgramAssignmentSchema.parse(req.body);
      const assignment = await storage.createProgramAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/program-assignments/:id', ensureRole(['admin', 'trainer']), async (req, res) => {
    try {
      const success = await storage.deleteProgramAssignment(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Program assignment not found' });
      }
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // Program Schedule routes
  app.get('/api/program-schedules', ensureAuthenticated, async (req, res) => {
    try {
      // Use logged-in user's ID 
      const userId = (req.user as any).id;
      const schedules = await storage.getProgramSchedules(userId);
      res.json(schedules);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.get('/api/program-schedules/:id', ensureAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getProgramSchedule(Number(req.params.id));
      
      if (!schedule) {
        return res.status(404).json({ error: 'Program schedule not found' });
      }
      
      // Check if user is authorized to view this schedule
      if (schedule.userId !== (req.user as any).id && 
          (req.user as any).role !== 'admin' && 
          (req.user as any).role !== 'trainer') {
        return res.status(403).json({ error: 'Unauthorized to access this schedule' });
      }
      
      res.json(schedule);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.post('/api/program-schedules', ensureAuthenticated, async (req, res) => {
    try {
      // Ensure the user ID in the request matches the logged-in user's ID
      // unless the user is an admin or trainer
      const scheduleData = { 
        ...req.body,
        userId: (req.user as any).id 
      };
      
      const parsedData = insertProgramScheduleSchema.parse(scheduleData);
      const schedule = await storage.createProgramSchedule(parsedData);
      res.status(201).json(schedule);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/program-schedules/:id', ensureAuthenticated, async (req, res) => {
    try {
      const scheduleId = Number(req.params.id);
      const existingSchedule = await storage.getProgramSchedule(scheduleId);
      
      if (!existingSchedule) {
        return res.status(404).json({ error: 'Program schedule not found' });
      }
      
      // Check if user is authorized to update this schedule
      if (existingSchedule.userId !== (req.user as any).id && 
          (req.user as any).role !== 'admin' && 
          (req.user as any).role !== 'trainer') {
        return res.status(403).json({ error: 'Unauthorized to update this schedule' });
      }
      
      const schedule = await storage.updateProgramSchedule(scheduleId, req.body);
      res.json(schedule);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.delete('/api/program-schedules/:id', ensureAuthenticated, async (req, res) => {
    try {
      const scheduleId = Number(req.params.id);
      const existingSchedule = await storage.getProgramSchedule(scheduleId);
      
      if (!existingSchedule) {
        return res.status(404).json({ error: 'Program schedule not found' });
      }
      
      // Check if user is authorized to delete this schedule
      if (existingSchedule.userId !== (req.user as any).id && 
          (req.user as any).role !== 'admin' && 
          (req.user as any).role !== 'trainer') {
        return res.status(403).json({ error: 'Unauthorized to delete this schedule' });
      }
      
      const success = await storage.deleteProgramSchedule(scheduleId);
      res.status(204).send();
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', ensureRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Remove password fields for security
      const sanitizedUsers = users.map(user => {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      
      res.json(sanitizedUsers);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  app.put('/api/users/:id', ensureRole(['admin']), async (req, res) => {
    try {
      // Do not allow password updates through this endpoint
      const { password, ...userData } = req.body;
      
      const user = await storage.updateUser(Number(req.params.id), userData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password before sending response
      const { password: _, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (err) {
      const error = handleError(err);
      res.status(error.status).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
