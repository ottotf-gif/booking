export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes);

  const newHours = date.getHours().toString().padStart(2, '0');
  const newMins = date.getMinutes().toString().padStart(2, '0');

  return `${newHours}:${newMins}`;
}

export function isTimeSlotAvailable(
  slotStart: string,
  slotEnd: string,
  appointments: Array<{ start_time: string; end_time: string }>
): boolean {
  return !appointments.some((appt) => {
    return (
      (slotStart >= appt.start_time && slotStart < appt.end_time) ||
      (slotEnd > appt.start_time && slotEnd <= appt.end_time) ||
      (slotStart <= appt.start_time && slotEnd >= appt.end_time)
    );
  });
}

export function generateTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }

  return slots;
}

export function getMinimumBookingDate(minimumNoticeHours: number = 2): string {
  const date = new Date();
  date.setHours(date.getHours() + minimumNoticeHours);
  return date.toISOString().split('T')[0];
}

export function getMaximumBookingDate(weeksAhead: number = 8): string {
  const date = new Date();
  date.setDate(date.getDate() + (weeksAhead * 7));
  return date.toISOString().split('T')[0];
}

export function isWithinCancellationWindow(
  appointmentDate: string,
  appointmentTime: string,
  hoursBeforeDeadline: number = 24
): boolean {
  const appointment = new Date(`${appointmentDate}T${appointmentTime}`);
  const deadline = new Date(appointment);
  deadline.setHours(deadline.getHours() - hoursBeforeDeadline);

  return new Date() < deadline;
}
