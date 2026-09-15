import React from 'react';

const StatusStepper = ({ currentStatus }) => {
  const steps = [
    { label: 'Registered', status: 'Registered' },
    { label: 'Assigned', status: 'Assigned' },
    { label: 'In Progress', status: 'In Progress' },
    { label: 'Work Completed', status: 'Resolved' },
    { label: 'Verified & Closed', status: 'Completed' }
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case 'Registered':
      case 'Pending': 
        return 0;
      case 'Assigned': 
        return 1;
      case 'In Progress':
      case 'Awaiting Materials': 
        return 2;
      case 'Resolved':
      case 'Work Completed': 
        return 3;
      case 'Completed':
      case 'Closed': 
        return 4;
      default: 
        return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="stepper">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex || ['Completed', 'Closed'].includes(currentStatus);
        const isActive = idx === currentIndex && !['Completed', 'Closed'].includes(currentStatus);

        return (
          <div 
            key={step.label} 
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? '✓' : idx + 1}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusStepper;
