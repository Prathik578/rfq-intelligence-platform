export type DeadlineAlertKind = "deadline" | "overdue" | null;

export function resolveNotificationRecipient(assignedUserId: number | null | undefined, actorId: number) {
  return assignedUserId ?? actorId;
}

export function deadlineAlertKind(deadline: Date | null | undefined, now = new Date()): DeadlineAlertKind {
  if (!deadline) return null;
  if (deadline <= now) return "overdue";
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return deadline <= windowEnd ? "deadline" : null;
}
