import cron from 'node-cron';
import webpush from 'web-push';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';

/**
 * Scheduled reminder job: runs every minute to check if any active prescriptions
 * have medicines due at the current time (HH:mm format).
 * If a matching dosage is due, it triggers a Web Push notification to the user's registered Service Worker.
 */
export const initReminderCron = () => {
  // Setup VAPID keys if configured in environment
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@medibridge.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  // Run every minute: '* * * * *'
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      // Find active prescriptions with timings matching currentTimeString
      const activePrescriptions = await Prescription.find({
        status: { $in: ['active', 'completed'] },
        'medicines.isActive': true,
        'medicines.timings': currentTimeString,
      }).populate('userId');

      for (const rx of activePrescriptions) {
        if (!rx.userId || !rx.userId.pushSubscription?.endpoint) continue;

        const dueMedicines = rx.medicines.filter(
          (m) => m.isActive && m.timings.includes(currentTimeString)
        );

        if (dueMedicines.length === 0) continue;

        const payload = JSON.stringify({
          title: `Time to take your medication (${currentTimeString})`,
          body: `Due now: ${dueMedicines.map((m) => m.medicineName).join(', ')}`,
          url: '/?reminderModal=true',
          medicines: dueMedicines,
        });

        await webpush
          .sendNotification(rx.userId.pushSubscription, payload)
          .catch((err) => {
            console.error('[WebPush Error] Failed to send push:', err.message);
          });
      }
    } catch (error) {
      console.error('[Cron Job Error] Reminder tick failed:', error.message);
    }
  });

  console.log('[ReminderCron] Service initialized: checking reminders every minute.');
};
