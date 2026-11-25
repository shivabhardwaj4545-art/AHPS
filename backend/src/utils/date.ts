import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth, differenceInMinutes, parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_TZ = 'Asia/Kolkata';

export const toIST = (date: Date | string): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, DEFAULT_TZ);
};

export const formatToIST = (date: Date | string, formatPattern = 'yyyy-MM-dd HH:mm:ss'): string => {
  const istDate = toIST(date);
  return format(istDate, formatPattern);
};

export const formatDateOnly = (date: Date | string): string => {
  const istDate = toIST(date);
  return format(istDate, 'yyyy-MM-dd');
};

export const parseTimeToDate = (timeStr: string, baseDate = new Date()): Date => {
  // timeStr: "08:30"
  return parse(timeStr, 'HH:mm', baseDate);
};

export const calculateMinutesBetween = (start: Date, end: Date): number => {
  return Math.max(0, differenceInMinutes(end, start));
};

export const getMonthDateRange = (yearMonth: string) => {
  // yearMonth format: "YYYY-MM"
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const daysInMonth = getDaysInMonth(startDate);
  const endDate = new Date(Date.UTC(year, month, daysInMonth, 23, 59, 59));

  return {
    startDate,
    endDate,
    daysInMonth,
  };
};

export const getAllDaysInMonth = (yearMonth: string): Date[] => {
  const { startDate, endDate } = getMonthDateRange(yearMonth);
  return eachDayOfInterval({ start: startDate, end: endDate });
};

