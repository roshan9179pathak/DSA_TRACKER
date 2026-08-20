// Computes the reminder date for a newly added (or re-attempted) question.
//
// Rule (as specified):
// - If added Mon/Tue/Wed     -> remind on the Sat/Sun of the week that is
//   ~1 week later.
// - If added Thu/Fri/Sat/Sun -> remind on the Sat/Sun of the week that is
//   ~2 weeks later.
//
// Implementation: take addedDate, jump forward by 1 or 2 weeks depending on
// the day it falls on, then snap forward to the nearest Saturday of that
// resulting week (so the reminder always lands on a Sat/Sun).

export function computeReminderDate(addedDate = new Date()) {
  const date = new Date(addedDate);
  const day = date.getDay(); // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat

  const isMonToWed = day >= 1 && day <= 3;
  const weeksToAdd = isMonToWed ? 1 : 2;

  const base = new Date(date);
  base.setDate(base.getDate() + weeksToAdd * 7);

  const baseDay = base.getDay();
  const diffToSaturday = (6 - baseDay + 7) % 7; // 0 if base is already Saturday

  const reminderDate = new Date(base);
  reminderDate.setDate(base.getDate() + diffToSaturday);
  reminderDate.setHours(0, 0, 0, 0);

  return reminderDate;
}

export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}
