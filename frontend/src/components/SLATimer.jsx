import React, { useState, useEffect } from 'react';

const SLATimer = ({ workOrder, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (!workOrder || !workOrder.slaDeadline) return;

    const calculateTime = () => {
      const deadline = new Date(workOrder.slaDeadline).getTime();
      const now = Date.now();
      const diff = deadline - now;

      // If already resolved or completed
      if (['Resolved', 'Completed', 'Closed'].includes(status)) {
        if (workOrder.slaBreached) {
          setIsBreached(true);
          setTimeLeft('SLA Breached');
        } else {
          setIsBreached(false);
          setTimeLeft('Met SLA Window');
        }
        return;
      }

      if (diff <= 0) {
        setIsBreached(true);
        const overdueMinutes = Math.floor(Math.abs(diff) / 60000);
        const hours = Math.floor(overdueMinutes / 60);
        const mins = overdueMinutes % 60;
        setTimeLeft(`Breached (${hours > 0 ? `${hours}h ` : ''}${mins}m overdue)`);
      } else {
        setIsBreached(false);
        const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${mins}m left`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000); // update every 10s
    return () => clearInterval(interval);
  }, [workOrder, status]);

  if (!workOrder || !workOrder.slaDeadline) {
    return (
      <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
        SLA Unscheduled
      </span>
    );
  }

  if (['Resolved', 'Completed', 'Closed'].includes(status)) {
    return (
      <span 
        className="badge" 
        style={{
          background: isBreached ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          color: isBreached ? '#fca5a5' : '#6ee7b7',
          border: isBreached ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
          fontWeight: 700,
          fontSize: '0.75rem',
        }}
      >
        {isBreached ? '⚠️ ' : '✓ '} {timeLeft}
      </span>
    );
  }

  return (
    <span 
      className="badge" 
      style={{
        background: isBreached ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)',
        color: isBreached ? '#f87171' : '#fbbf24',
        border: isBreached ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.4)',
        fontWeight: 700,
        fontSize: '0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        letterSpacing: '0.2px',
      }}
      title={`SLA Target: ${workOrder.slaHours}h | Deadline: ${new Date(workOrder.slaDeadline).toLocaleTimeString()}`}
    >
      <span>{isBreached ? '🚨' : '⏳'}</span>
      <span>{timeLeft}</span>
    </span>
  );
};

export default SLATimer;
