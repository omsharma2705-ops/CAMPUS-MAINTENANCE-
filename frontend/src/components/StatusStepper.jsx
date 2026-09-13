import React from 'react';

const StatusStepper = ({ currentStatus }) => {
  const steps = [
    { label: 'Lodged', status: 'Pending' },
    { label: 'Assigned', status: 'Assigned' },
    { label: 'In Progress', status: 'In Progress' },
    { label: 'Resolved', status: 'Resolved' },
    { label: 'Verified & Closed', status: 'Closed' }
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Assigned': return 1;
      case 'In Progress': return 2;
      case 'Resolved': return 3;
      case 'Closed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="stepper">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex || currentStatus === 'Closed';
        const isActive = idx === currentIndex && currentStatus !== 'Closed';

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
