import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Define the ProgramSchedule type inline to avoid import issues in tests
interface ProgramSchedule {
  id: string;
  programId: number;
  startDate: string;
  endDate: string;
  selectedWeekdays: number[];
  active: boolean;
}

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

// Import the hook after setting up the mock
import { useScheduleChecks } from '../hooks/useScheduleChecks';

describe('useScheduleChecks', () => {
  // Clear localStorage and reset mocks before each test
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper function to create test schedules
  function createTestSchedule({
    id = 'test-id',
    programId = 1,
    startDate = '2025-04-01',
    endDate = '2025-04-15',
    selectedWeekdays = [1, 3], // Monday, Wednesday
    active = true
  }: Partial<ProgramSchedule> = {}): ProgramSchedule {
    return {
      id,
      programId,
      startDate,
      endDate,
      selectedWeekdays,
      active
    };
  }

  // Test that schedules are correctly loaded from localStorage
  it('loads schedules from localStorage', () => {
    // Arrange
    const testSchedule = createTestSchedule();
    window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
    
    // Act
    const { schedules } = useScheduleChecks();
    
    // Assert
    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toEqual(testSchedule);
  });

  // Test that getSchedulesForDate returns correct schedules
  it('returns schedules for a specific date', () => {
    // Arrange
    const testSchedule = createTestSchedule();
    window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
    
    // Set date to a Monday (day 1)
    const testDate = new Date(2025, 3, 7); // April 7, 2025 (a Monday)
    vi.setSystemTime(testDate);
    
    // Act
    const { getSchedulesForDate } = useScheduleChecks();
    const result = getSchedulesForDate(testDate);
    
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(testSchedule);
  });

  // Test that schedules outside date range are excluded
  it('excludes schedules outside of date range', () => {
    // Arrange
    const testSchedule = createTestSchedule({
      startDate: '2025-04-01',
      endDate: '2025-04-05',
    });
    window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
    
    // Set date to April 10 (outside range)
    const testDate = new Date(2025, 3, 10);
    vi.setSystemTime(testDate);
    
    // Act
    const { getSchedulesForDate } = useScheduleChecks();
    const result = getSchedulesForDate(testDate);
    
    // Assert
    expect(result).toHaveLength(0);
  });

  // Test that schedules for wrong weekday are excluded
  it('excludes schedules for non-matching weekdays', () => {
    // Arrange
    const testSchedule = createTestSchedule({
      selectedWeekdays: [1, 3], // Monday, Wednesday
    });
    window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
    
    // Set date to a Tuesday (day 2)
    const testDate = new Date(2025, 3, 8); // April 8, 2025 (a Tuesday)
    vi.setSystemTime(testDate);
    
    // Act
    const { getSchedulesForDate } = useScheduleChecks();
    const result = getSchedulesForDate(testDate);
    
    // Assert
    expect(result).toHaveLength(0);
  });

  // Test that inactive schedules are excluded
  it('excludes inactive schedules', () => {
    // Arrange
    const testSchedule = createTestSchedule({
      active: false
    });
    window.localStorage.setItem('repwizard_program_schedules', JSON.stringify([testSchedule]));
    
    // Set date to a Monday (should match except for active status)
    const testDate = new Date(2025, 3, 7); // April 7, 2025 (a Monday)
    vi.setSystemTime(testDate);
    
    // Act
    const { getSchedulesForDate } = useScheduleChecks();
    const result = getSchedulesForDate(testDate);
    
    // Assert
    expect(result).toHaveLength(0);
  });
});