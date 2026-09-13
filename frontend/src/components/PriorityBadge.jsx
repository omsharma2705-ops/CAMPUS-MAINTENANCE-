import React from 'react';

const PriorityBadge = ({ priority }) => {
  let badgeClass = 'badge-p-medium';
  let icon = '🟡';

  switch (priority) {
    case 'Low':
      badgeClass = 'badge-p-low';
      icon = '🟢';
      break;
    case 'High':
      badgeClass = 'badge-p-high';
      icon = '🟠';
      break;
    case 'Emergency':
      badgeClass = 'badge-p-emergency';
      icon = '🚨';
      break;
    case 'Medium':
    default:
      badgeClass = 'badge-p-medium';
      icon = '🟡';
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span>{icon}</span>
      <span>{priority}</span>
    </span>
  );
};

export default PriorityBadge;
