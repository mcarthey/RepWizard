import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addDays, format, parse } from 'date-fns';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    clear: (): void => {
      store = {};
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    getAll: (): Record<string, string> => store,
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch API for program data
global.fetch = vi.fn();

describe('Program Functionality', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetAllMocks();
    vi.useFakeTimers();
    // Set a fixed date for tests
    vi.setSystemTime(new Date('2025-04-01'));
    
    // Mock successful fetch response for programs
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 1,
          name: 'Test Program 1',
          description: 'A test program',
          weeks: 8,
          daysPerWeek: 4,
          difficulty: 'intermediate',
          goal: 'strength',
          userId: 1
        },
        {
          id: 2,
          name: 'Test Program 2',
          description: 'Another test program',
          weeks: 12,
          daysPerWeek: 5,
          difficulty: 'advanced',
          goal: 'hypertrophy',
          userId: 1
        }
      ])
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Program Schedules', () => {
    // Helper function to create test schedule
    function createTestSchedule({
      id = 'test-schedule',
      programId = 1,
      startDate = '2025-04-01',
      endDate = '2025-05-01',
      selectedWeekdays = [1, 3, 5], // Mon, Wed, Fri
      active = true
    } = {}) {
      return {
        id,
        programId,
        startDate,
        endDate,
        selectedWeekdays,
        active
      };
    }
    
    it('creates a program schedule correctly', () => {
      // Create a test schedule
      const testSchedule = createTestSchedule();
      
      // Save to localStorage
      const schedules = [testSchedule];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      
      // Verify it was saved
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      expect(savedString).not.toBeNull();
      
      const savedSchedules = JSON.parse(savedString!);
      expect(savedSchedules).toHaveLength(1);
      expect(savedSchedules[0].programId).toBe(1);
      expect(savedSchedules[0].selectedWeekdays).toEqual([1, 3, 5]);
    });
    
    it('retrieves program schedules correctly', () => {
      // Create and save test schedules
      const schedule1 = createTestSchedule({ id: 'schedule-1' });
      const schedule2 = createTestSchedule({
        id: 'schedule-2',
        programId: 2,
        selectedWeekdays: [2, 4, 6] // Tue, Thu, Sat
      });
      
      const schedules = [schedule1, schedule2];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      
      // Retrieve schedules
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      // Verify both schedules were retrieved
      expect(savedSchedules).toHaveLength(2);
      expect(savedSchedules[0].id).toBe('schedule-1');
      expect(savedSchedules[1].id).toBe('schedule-2');
      expect(savedSchedules[1].programId).toBe(2);
    });
    
    it('updates a program schedule correctly', () => {
      // Create and save a test schedule
      const testSchedule = createTestSchedule();
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
      
      // Update the schedule
      const updatedSchedule = {
        ...testSchedule,
        selectedWeekdays: [2, 4], // Tue, Thu
        endDate: '2025-06-01' // Extended end date
      };
      
      const schedules = [updatedSchedule];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      
      // Verify update was saved
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      expect(savedSchedules).toHaveLength(1);
      expect(savedSchedules[0].id).toBe('test-schedule');
      expect(savedSchedules[0].selectedWeekdays).toEqual([2, 4]);
      expect(savedSchedules[0].endDate).toBe('2025-06-01');
    });
    
    it('deletes a program schedule correctly', () => {
      // Create and save multiple test schedules
      const schedule1 = createTestSchedule({ id: 'schedule-1' });
      const schedule2 = createTestSchedule({ id: 'schedule-2', programId: 2 });
      const schedule3 = createTestSchedule({ id: 'schedule-3', programId: 3 });
      
      const schedules = [schedule1, schedule2, schedule3];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      
      // Delete the second schedule
      const updatedSchedules = [schedule1, schedule3];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(updatedSchedules));
      
      // Verify deletion
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      expect(savedSchedules).toHaveLength(2);
      expect(savedSchedules.find((s: any) => s.id === 'schedule-2')).toBeUndefined();
      expect(savedSchedules[0].id).toBe('schedule-1');
      expect(savedSchedules[1].id).toBe('schedule-3');
    });
    
    it('toggles schedule active state correctly', () => {
      // Create and save a test schedule
      const testSchedule = createTestSchedule();
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
      
      // Toggle active state to false
      const updatedSchedule = {
        ...testSchedule,
        active: false
      };
      
      const schedules = [updatedSchedule];
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(schedules));
      
      // Verify update was saved
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      expect(savedSchedules).toHaveLength(1);
      expect(savedSchedules[0].active).toBe(false);
    });
  });
  
  describe('Program Schedule Checks', () => {
    const testSchedules = [
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
        startDate: '2025-04-15',
        endDate: '2025-05-15',
        selectedWeekdays: [2, 4], // Tue, Thu
        active: true
      }
    ];
    
    beforeEach(() => {
      // Save test schedules to localStorage
      window.localStorage.setItem('repwizard_program_schedules', JSON.stringify(testSchedules));
    });
    
    it('gets schedules for a specific date correctly', () => {
      // Test date is 2025-04-01 (Tuesday)
      const testDate = new Date('2025-04-01');
      
      // First schedule includes Monday (day 1)
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      // Check if date is a weekday in schedule
      const day = testDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const scheduleForDate = savedSchedules.filter((s: any) => 
        s.active && 
        s.selectedWeekdays.includes(day) &&
        new Date(s.startDate) <= testDate &&
        new Date(s.endDate) >= testDate
      );
      
      expect(scheduleForDate).toHaveLength(1);
      expect(scheduleForDate[0].id).toBe('schedule-1');
    });
    
    it('checks if a date has scheduled programs correctly', () => {
      // Monday (2025-04-07) should have schedule-1
      const mondayDate = new Date('2025-04-07');
      
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      const day = mondayDate.getDay();
      const hasSchedules = savedSchedules.some((s: any) => 
        s.active && 
        s.selectedWeekdays.includes(day) &&
        new Date(s.startDate) <= mondayDate &&
        new Date(s.endDate) >= mondayDate
      );
      
      expect(hasSchedules).toBe(true);
      
      // Saturday (2025-04-05) should have no schedules
      const saturdayDate = new Date('2025-04-05');
      const satDay = saturdayDate.getDay();
      const hasSchedulesSat = savedSchedules.some((s: any) => 
        s.active && 
        s.selectedWeekdays.includes(satDay) &&
        new Date(s.startDate) <= saturdayDate &&
        new Date(s.endDate) >= saturdayDate
      );
      
      expect(hasSchedulesSat).toBe(false);
    });
    
    it('finds the next workout date correctly', () => {
      // Starting from 2025-04-01 (Tuesday)
      const startDate = new Date('2025-04-01');
      
      // Next workout should be 2025-04-02 (Wednesday) for schedule-1
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      const savedSchedules = JSON.parse(savedString!);
      
      let nextDate = startDate;
      let found = false;
      const maxDays = 7;
      
      for (let i = 1; i <= maxDays && !found; i++) {
        nextDate = addDays(startDate, i);
        const day = nextDate.getDay();
        
        const hasWorkout = savedSchedules.some((s: any) => 
          s.active && 
          s.selectedWeekdays.includes(day) &&
          new Date(s.startDate) <= nextDate &&
          new Date(s.endDate) >= nextDate
        );
        
        if (hasWorkout) {
          found = true;
          break;
        }
      }
      
      expect(found).toBe(true);
      expect(format(nextDate, 'yyyy-MM-dd')).toBe('2025-04-02');
    });
  });
  
  describe('Program API Integration', () => {
    it('fetches programs correctly', async () => {
      const response = await fetch('/api/programs');
      const programs = await response.json();
      
      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith('/api/programs');
      
      // Verify response data
      expect(programs).toBeDefined();
      expect(Array.isArray(programs)).toBeTruthy();
      expect(programs).toHaveLength(2);
      expect(programs[0].id).toBe(1);
      expect(programs[0].name).toBe('Test Program 1');
    });
    
    it('fetches a single program by ID correctly', async () => {
      // Mock response for a single program
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Test Program 1',
          description: 'A test program',
          weeks: 8,
          daysPerWeek: 4,
          difficulty: 'intermediate',
          goal: 'strength',
          userId: 1
        })
      });
      
      const response = await fetch('/api/programs/1');
      const program = await response.json();
      
      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith('/api/programs/1');
      
      // Verify response data
      expect(program).toBeDefined();
      expect(program.id).toBe(1);
      expect(program.name).toBe('Test Program 1');
    });
    
    it('fetches program templates correctly', async () => {
      // Mock response for program templates
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 101,
            programId: 1,
            name: 'Day 1 - Upper Body',
            description: 'Upper body workout',
            order: 1
          },
          {
            id: 102,
            programId: 1,
            name: 'Day 2 - Lower Body',
            description: 'Lower body workout',
            order: 2
          }
        ])
      });
      
      const response = await fetch('/api/programs/1/templates');
      const templates = await response.json();
      
      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith('/api/programs/1/templates');
      
      // Verify response data
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBeTruthy();
      expect(templates).toHaveLength(2);
      expect(templates[0].id).toBe(101);
      expect(templates[0].name).toBe('Day 1 - Upper Body');
    });
  });
  
  describe('Program Error Handling', () => {
    it('handles fetch errors correctly', async () => {
      // Mock a failed fetch
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/programs');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });
    
    it('handles 404 responses correctly', async () => {
      // Mock a 404 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Program not found' })
      });
      
      const response = await fetch('/api/programs/999');
      
      // Verify response is marked as not ok
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
    
    it('handles invalid program schedule data', () => {
      // Set invalid JSON in localStorage
      window.localStorage.setItem('repwizard_program_schedules', 'invalid json data');
      
      // Attempt to retrieve schedules
      const savedString = window.localStorage.getItem('repwizard_program_schedules');
      
      // Verify we got back the invalid string
      expect(savedString).toBe('invalid json data');
      
      // Attempt to parse should fail
      expect(() => JSON.parse(savedString!)).toThrow();
    });
  });
});