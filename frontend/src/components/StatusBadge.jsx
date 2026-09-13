import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-pending';
  let icon = '⏳';

  switch (status) {
    case 'Assigned':
      badgeClass = 'badge-assigned';
      icon = '👷';
      break;
    case 'In Progress':
      badgeClass = 'badge-in-progress';
      icon = '⚡';
      break;
    case 'Resolved':
      badgeClass = 'badge-resolved';
      icon = '✅';
      break;
    case 'Closed':
      badgeClass = 'badge-closed';
      icon = '🔒';
      break;
    case 'Pending':
    default:
      badgeClass = 'badge-pending';
      icon = '⏳';
      break;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span>{icon}</span>
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
