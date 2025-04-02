import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WorkoutCalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDateChange: (date: Date) => void;
  currentDate: Date;
}

// Modal for selecting a date from the calendar
const WorkoutCalendarModal = ({
  isVisible,
  onClose,
  onDateChange,
  currentDate
}: WorkoutCalendarModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentDate);
  
  const handleClose = () => {
    onClose();
  };
  
  const handleChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  const handleSelectDate = () => {
    if (selectedDate) {
      onDateChange(selectedDate);
      onClose();
    }
  };
  
  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Workout Date</DialogTitle>
          <DialogDescription>
            Choose a date to view or create a workout
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleChange}
            initialFocus
          />
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedDate && `Selected: ${format(selectedDate, 'MMMM d, yyyy')}`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSelectDate} disabled={!selectedDate}>
              Select Date
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutCalendarModal;