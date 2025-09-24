import React from 'react';
import MuscleGroupLinks from '../components/MuscleGroupLinks';
import ExerciseTracker from '../components/ExerciseTracker';

interface WorkoutDayProps {
  dayName: string;
}

const WorkoutDay: React.FC<WorkoutDayProps> = ({ dayName }) => {
  return (
    <div className="space-y-6">
      <MuscleGroupLinks dayName={dayName} />
      <ExerciseTracker dayName={dayName} />
    </div>
  );
};

export default WorkoutDay;