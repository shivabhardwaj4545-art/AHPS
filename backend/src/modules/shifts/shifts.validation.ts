import { z } from 'zod';

export const shiftSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Shift name required'),
    code: z.string().min(2, 'Shift code required'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 08:30)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (e.g. 15:30)'),
    gracePeriodMinutes: z.number().int().nonnegative().default(15),
    halfDayMinimumMinutes: z.number().int().positive().default(240),
    fullDayMinimumMinutes: z.number().int().positive().default(390),
    isOvernight: z.boolean().default(false),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
  }),
});

