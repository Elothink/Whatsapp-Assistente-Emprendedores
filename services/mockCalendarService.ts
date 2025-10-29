
import type { CalendarSlot } from '../types';

export const mockCalendarService = {
  getAvailableSlots: async (): Promise<CalendarSlot[]> => {
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    const slots: CalendarSlot[] = [];
    const now = new Date();
    now.setMinutes(0, 0, 0); // Start from the beginning of the hour

    for (let i = 0; i < 7; i++) {
        const startTime = new Date(now.getTime() + i * 60 * 60 * 1000); // Add i hours
        // Skip lunch time and early/late hours
        if (startTime.getHours() >= 9 && startTime.getHours() < 12 || startTime.getHours() >= 14 && startTime.getHours() < 18) {
             if (Math.random() > 0.3) { // Simulate some busy slots
                const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                slots.push({
                    id: `slot-${i}`,
                    startTime,
                    endTime,
                });
             }
        }
    }
    return slots;
  },
};
