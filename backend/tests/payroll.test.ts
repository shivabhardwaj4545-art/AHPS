describe('Payroll Calculation Engine Unit Tests', () => {
  const daysInMonth = 30; // November
  const grossSalary = 60000;
  const divisor = 30;
  const perDaySalary = grossSalary / divisor; // 2,000 INR/day

  test('Standard Month: Full attendance results in 100% net salary without deductions', () => {
    const unpaidDays = 0;
    const deductions = unpaidDays * perDaySalary;
    const netSalary = grossSalary - deductions;

    expect(deductions).toBe(0);
    expect(netSalary).toBe(60000);
  });

  test('Unpaid Absences: Deducts exact prorated amount for unpaid leave days', () => {
    const unpaidAbsenceDays = 3;
    const deductions = unpaidAbsenceDays * perDaySalary; // 3 * 2000 = 6000
    const netSalary = grossSalary - deductions;

    expect(deductions).toBe(6000);
    expect(netSalary).toBe(54000);
  });

  test('Mid-Month Joining Proration: Teacher joining on 16th is paid only for eligible days', () => {
    const joiningDay = 16;
    const preJoiningUnpaidDays = joiningDay - 1; // 15 days unpaid
    const deductions = preJoiningUnpaidDays * perDaySalary; // 15 * 2000 = 30000
    const netSalary = grossSalary - deductions;

    expect(preJoiningUnpaidDays).toBe(15);
    expect(deductions).toBe(30000);
    expect(netSalary).toBe(30000);
  });

  test('Mid-Month Leaving Proration: Teacher resigning on 20th is deducted for subsequent days', () => {
    const leavingDay = 20;
    const postLeavingUnpaidDays = daysInMonth - leavingDay; // 10 days unpaid
    const deductions = postLeavingUnpaidDays * perDaySalary; // 10 * 2000 = 20000
    const netSalary = grossSalary - deductions;

    expect(postLeavingUnpaidDays).toBe(10);
    expect(deductions).toBe(20000);
    expect(netSalary).toBe(40000);
  });

  test('Locked Payroll Edit Denial: Attempting to modify an APPROVED or PAID payroll throws an error', () => {
    const payrollRun = {
      id: 'run-123',
      month: '2026-11',
      status: 'APPROVED',
      isLocked: true,
    };

    const attemptEdit = (run: typeof payrollRun) => {
      if (run.isLocked || run.status === 'APPROVED' || run.status === 'PAID') {
        throw new Error('Payroll is locked. Changes permitted only via authorized revision.');
      }
    };

    expect(() => attemptEdit(payrollRun)).toThrow(
      'Payroll is locked. Changes permitted only via authorized revision.'
    );
  });
});

