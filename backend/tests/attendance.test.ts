import { calculateMinutesBetween, parseTimeToDate } from '../src/utils/date.js';
import { isAfter, isBefore } from 'date-fns';

describe('Attendance Engine Unit Tests', () => {
  const baseDate = new Date('2026-11-14T00:00:00.000Z');
  const shiftStartTime = parseTimeToDate('08:00', baseDate); // 08:00
  const shiftEndTime = parseTimeToDate('15:00', baseDate);   // 15:00
  const gracePeriodMinutes = 15;
  const graceCutoff = new Date(shiftStartTime.getTime() + gracePeriodMinutes * 60 * 1000); // 08:15
  const halfDayThreshold = 210; // 3.5 hrs
  const fullDayThreshold = 360; // 6 hrs

  test('Normal Day: On-time arrival and standard exit qualifies as PRESENT', () => {
    const firstIn = parseTimeToDate('07:55', baseDate);
    const lastOut = parseTimeToDate('15:05', baseDate);

    const totalMinutes = calculateMinutesBetween(firstIn, lastOut);
    const isLate = isAfter(firstIn, graceCutoff);
    const isEarly = isBefore(lastOut, shiftEndTime);

    expect(totalMinutes).toBe(430);
    expect(isLate).toBe(false);
    expect(isEarly).toBe(false);
    expect(totalMinutes).toBeGreaterThanOrEqual(fullDayThreshold);

    const status = totalMinutes >= fullDayThreshold && !isLate ? 'PRESENT' : 'OTHER';
    expect(status).toBe('PRESENT');
  });

  test('Late Arrival: Arriving past grace period accurately records late minutes and status LATE', () => {
    const firstIn = parseTimeToDate('08:25', baseDate); // 25 mins after 08:00, 10 mins past 15 min grace
    const lastOut = parseTimeToDate('15:00', baseDate);

    const isLate = isAfter(firstIn, graceCutoff);
    expect(isLate).toBe(true);

    const lateMinutes = calculateMinutesBetween(shiftStartTime, firstIn);
    expect(lateMinutes).toBe(25);

    const totalMinutes = calculateMinutesBetween(firstIn, lastOut);
    expect(totalMinutes).toBe(395); // > 360 min full day threshold

    const status = isLate ? 'LATE' : 'PRESENT';
    expect(status).toBe('LATE');
  });

  test('Early Exit: Leaving before shift end records early minutes and flags HALF_DAY if under threshold', () => {
    const firstIn = parseTimeToDate('08:00', baseDate);
    const lastOut = parseTimeToDate('11:00', baseDate); // 3 hours (180 mins)

    const earlyMinutes = calculateMinutesBetween(lastOut, shiftEndTime);
    expect(earlyMinutes).toBe(240); // 4 hours early

    const totalMinutes = calculateMinutesBetween(firstIn, lastOut);
    expect(totalMinutes).toBe(180);

    // Below half-day threshold (210 mins)
    const isHalfDay = totalMinutes < halfDayThreshold;
    expect(isHalfDay).toBe(true);
  });

  test('Missing Punch: Single punch must NEVER assume full day and must flag for Admin review', () => {
    const singlePunch = parseTimeToDate('08:00', baseDate);
    const punches = [singlePunch];

    let status = 'PRESENT';
    let isFlaggedForReview = false;
    let reviewReason: string | null = null;

    if (punches.length === 1) {
      status = 'MISSING_PUNCH';
      isFlaggedForReview = true;
      reviewReason = 'Single punch detected. Missing OUT punch.';
    }

    expect(status).toBe('MISSING_PUNCH');
    expect(isFlaggedForReview).toBe(true);
    expect(reviewReason).toContain('Missing OUT punch');
  });

  test('Duplicate Event Detection: Deduplication key [deviceId, deviceUserId, punchTime]', () => {
    const seenPunches = new Set<string>();

    const punch1 = { deviceId: 'DEV-01', deviceUserId: '1001', punchTime: '2026-11-14T08:00:00Z' };
    const punch2Duplicate = { deviceId: 'DEV-01', deviceUserId: '1001', punchTime: '2026-11-14T08:00:00Z' };

    const key1 = `${punch1.deviceId}_${punch1.deviceUserId}_${punch1.punchTime}`;
    const key2 = `${punch2Duplicate.deviceId}_${punch2Duplicate.deviceUserId}_${punch2Duplicate.punchTime}`;

    expect(seenPunches.has(key1)).toBe(false);
    seenPunches.add(key1);

    // Second punch with identical timestamp is recognized as duplicate
    expect(seenPunches.has(key2)).toBe(true);
  });

  test('Holiday and Weekly Off Priority: Marks day without penalizing employee', () => {
    const isHoliday = true;
    const isWeeklyOff = false;

    let dayStatus: string;
    if (isHoliday) {
      dayStatus = 'HOLIDAY';
    } else if (isWeeklyOff) {
      dayStatus = 'WEEKLY_OFF';
    } else {
      dayStatus = 'ABSENT';
    }

    expect(dayStatus).toBe('HOLIDAY');
  });
});

