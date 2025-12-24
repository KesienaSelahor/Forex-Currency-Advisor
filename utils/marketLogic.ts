
import { KILL_ZONE, SESSIONS } from '../constants';

/**
 * Returns the current time in Africa/Lagos timezone
 */
export const getLagosTime = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 1));
};

export const formatLagosTime = (date: Date): string => {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const getActiveSessions = (lagosTime: Date) => {
  const hour = lagosTime.getHours();
  return SESSIONS.map(s => ({
    ...s,
    isOpen: hour >= s.start && hour < s.end
  }));
};

export const isOverlapActive = (lagosTime: Date): boolean => {
  const hour = lagosTime.getHours();
  // London/NY Overlap is 14:00 - 17:00
  return hour >= 14 && hour <= 17;
};

export const isKillZone = (lagosTime: Date): boolean => {
  const hour = lagosTime.getHours();
  return hour >= KILL_ZONE.start && hour < KILL_ZONE.end;
};

export const calculateVolatilityScore = (lagosTime: Date): number => {
  const hour = lagosTime.getHours();
  if (hour >= 13 && hour <= 17) return 90;
  if (hour >= 8 && hour <= 10) return 75;
  if (hour >= 14 && hour <= 16) return 85;
  if (hour >= 1 && hour <= 4) return 40;
  return 20;
};
