import { prisma } from '../config/db.js';
import { PunchesService } from '../modules/punches/punches.service.js';
import { format } from 'date-fns';

async function runSimulator() {
  console.log('🚀 Starting Biometric Device Hardware Simulator...');

  // 1. Locate Device
  const device = await prisma.device.findFirst({
    where: { deviceCode: 'BIO-GATE-01' },
  });

  if (!device) {
    console.error('❌ Device BIO-GATE-01 not found. Please run npm run seed first.');
    process.exit(1);
  }

  // 2. Fetch mapped teachers
  const mappings = await prisma.deviceEmployeeMap.findMany({
    where: { deviceId: device.id },
    include: { employee: true },
  });

  if (mappings.length === 0) {
    console.error('❌ No employees mapped to device BIO-GATE-01. Please run seed.');
    process.exit(1);
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  console.log(`📅 Simulating punches for Date: ${todayStr}`);

  // Create varied scenarios:
  // Teacher 1 (1001): Normal on-time arrival (07:55 AM) and normal exit (15:05 PM)
  // Teacher 2 (1002): Late arrival (08:25 AM, 25 mins late) and normal exit (15:00 PM)
  // Teacher 3 (1003): Missing OUT punch (only arrived at 08:00 AM)

  const simulatedPunches: any[] = [];

  const m1 = mappings.find((m) => m.deviceUserId === '1001') || mappings[0];
  if (m1) {
    simulatedPunches.push(
      {
        deviceId: device.id,
        deviceUserId: m1.deviceUserId,
        punchTime: `${todayStr}T07:55:00.000Z`,
        punchType: 'CHECK_IN',
        verifyType: 'FACE',
      },
      {
        deviceId: device.id,
        deviceUserId: m1.deviceUserId,
        punchTime: `${todayStr}T15:05:00.000Z`,
        punchType: 'CHECK_OUT',
        verifyType: 'FINGERPRINT',
      }
    );
  }

  const m2 = mappings.find((m) => m.deviceUserId === '1002');
  if (m2) {
    simulatedPunches.push(
      {
        deviceId: device.id,
        deviceUserId: m2.deviceUserId,
        punchTime: `${todayStr}T08:25:00.000Z`, // 25 min late (past 15 min grace)
        punchType: 'CHECK_IN',
        verifyType: 'FINGERPRINT',
      },
      {
        deviceId: device.id,
        deviceUserId: m2.deviceUserId,
        punchTime: `${todayStr}T15:00:00.000Z`,
        punchType: 'CHECK_OUT',
        verifyType: 'FINGERPRINT',
      }
    );
  }

  const m3 = mappings.find((m) => m.deviceUserId === '1003');
  if (m3) {
    simulatedPunches.push({
      deviceId: device.id,
      deviceUserId: m3.deviceUserId,
      punchTime: `${todayStr}T08:02:00.000Z`,
      punchType: 'CHECK_IN',
      verifyType: 'FACE',
      // No OUT punch -> Should trigger MISSING_PUNCH flag in attendance processor!
    });
  }

  console.log(`📡 Ingesting ${simulatedPunches.length} simulated biometric punch events...`);

  const result = await PunchesService.ingestPunches(device.id, simulatedPunches);

  console.log('✅ Simulation Results:');
  console.log(`   - Total Submitted: ${result.totalSubmitted}`);
  console.log(`   - Newly Inserted: ${result.inserted}`);
  console.log(`   - Duplicates Ignored: ${result.duplicates}`);
  console.log(`   - Processing Status: ${result.status}`);

  console.log('\n⚙️ Triggering Attendance Calculation Engine for today...');
  const { AttendanceProcessor } = await import('../modules/attendance/attendance.service.js');
  const attResult = await AttendanceProcessor.processDailyAttendance(new Date());

  console.log('✅ Daily Attendance Calculated:');
  console.log(`   - Processed Teachers: ${attResult.processedCount}`);
  console.log(`   - Details:`, attResult.summary);
  console.log('\n✨ Simulator run finished successfully!');
}

runSimulator()
  .catch((e) => {
    console.error('Simulation failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

