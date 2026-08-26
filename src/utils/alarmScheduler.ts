/**
 * Alarm and Notification Scheduler
 * Calculates departure alarms and dispatches notifications via ServiceWorker and Notification API.
 * Supports Time Injection (Clock Provider) for deterministic unit testing without waiting for real time.
 */

import { OptimizationResult, ScheduledAlarm } from '../types';
import { dateTimeToTimestamp, timeStringToMinutes } from './timeUtils';

export type TimeProvider = () => number;

export interface NotificationPayload {
  title: string;
  body: string;
  tag: string;
  scheduledTime: number;
  data?: any;
}

export class AlarmScheduler {
  private scheduledAlarms: ScheduledAlarm[] = [];
  private activeTimers: Map<string, number> = new Map();
  private timeProvider: TimeProvider;
  private notificationSender?: (payload: NotificationPayload) => void;

  constructor(
    timeProvider: TimeProvider = () => Date.now(),
    customSender?: (payload: NotificationPayload) => void
  ) {
    this.timeProvider = timeProvider;
    this.notificationSender = customSender;
  }

  /**
   * Set custom clock provider for testing.
   */
  setTimeProvider(provider: TimeProvider): void {
    this.timeProvider = provider;
  }

  /**
   * Clears all active scheduled timers and alarms.
   */
  clearAllAlarms(): void {
    this.activeTimers.forEach((timerId) => clearTimeout(timerId));
    this.activeTimers.clear();
    this.scheduledAlarms = [];
  }

  /**
   * Calculates and schedules departure alarms from the optimization result for a specific date.
   * Formula: Departure Time = Target Arrival Time - Travel Time - Buffer Time
   */
  scheduleFromOptimization(
    optimization: OptimizationResult,
    dateStr: string // "YYYY-MM-DD"
  ): ScheduledAlarm[] {
    this.clearAllAlarms();
    if (!optimization || !optimization.isFeasible || optimization.legs.length === 0) {
      return [];
    }

    const now = this.timeProvider();
    const newAlarms: ScheduledAlarm[] = [];

    // Filter legs that represent going to a schedule item
    for (const leg of optimization.legs) {
      if (!leg.scheduleItem) continue;

      const schedule = leg.scheduleItem;
      const departureTimeStr = leg.departureTime;
      const departureTimestamp = dateTimeToTimestamp(dateStr, departureTimeStr);

      const alarm: ScheduledAlarm = {
        id: `alarm_${schedule.id}_${departureTimeStr}`,
        scheduleId: schedule.id,
        title: `[외출 알림] '${schedule.title}' 출발 시각입니다!`,
        departureTime: departureTimeStr,
        targetTimeMs: departureTimestamp,
        bufferMinutes: leg.bufferMinutes,
        isDispatched: departureTimestamp <= now,
        createdAt: now,
      };

      newAlarms.push(alarm);

      // If scheduled time is in the future
      if (departureTimestamp > now) {
        const delayMs = departureTimestamp - now;

        // In production runtime, setup browser timeout and ServiceWorker schedule
        if (typeof window !== 'undefined') {
          const timerId = window.setTimeout(() => {
            this.dispatchNotification({
              title: alarm.title,
              body: `장소: ${schedule.location.name} | 이동: ${leg.travelDurationMinutes}분 (${leg.transportMode}) | 여유시간 ${leg.bufferMinutes}분 반영됨`,
              tag: `dep_${schedule.id}`,
              scheduledTime: departureTimestamp,
              data: { scheduleId: schedule.id, departureTime: departureTimeStr },
            });
            alarm.isDispatched = true;
          }, delayMs);

          this.activeTimers.set(alarm.id, timerId);

          // Also schedule to Service Worker for background wakeups
          this.scheduleToServiceWorker({
            title: alarm.title,
            body: `장소: ${schedule.location.name} | 이동: ${leg.travelDurationMinutes}분 | 여유시간 ${leg.bufferMinutes}분 반영`,
            tag: `dep_${schedule.id}`,
            scheduledTime: departureTimestamp,
          });
        }
      }
    }

    this.scheduledAlarms = newAlarms;
    return newAlarms;
  }

  /**
   * Direct testable trigger: Simulates current time tick and dispatches alarms that are due.
   */
  evaluateDueAlarmsAt(timestampMs: number): ScheduledAlarm[] {
    const triggered: ScheduledAlarm[] = [];

    for (const alarm of this.scheduledAlarms) {
      if (!alarm.isDispatched && alarm.targetTimeMs <= timestampMs) {
        alarm.isDispatched = true;
        triggered.push(alarm);
        if (this.notificationSender) {
          this.notificationSender({
            title: alarm.title,
            body: `출발 시각 ${alarm.departureTime} (여유시간 ${alarm.bufferMinutes}분 포함)`,
            tag: alarm.id,
            scheduledTime: alarm.targetTimeMs,
          });
        }
      }
    }

    return triggered;
  }

  /**
   * Dispatches system notification if permission granted.
   */
  async dispatchNotification(payload: NotificationPayload): Promise<void> {
    if (this.notificationSender) {
      this.notificationSender(payload);
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Direct notification error:', err);
      }
    }
  }

  /**
   * Posts message to Service Worker for tab-closed notifications.
   */
  private scheduleToServiceWorker(payload: NotificationPayload): void {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        ...payload,
      });
    }
  }

  getScheduledAlarms(): ScheduledAlarm[] {
    return [...this.scheduledAlarms];
  }
}

export const defaultAlarmScheduler = new AlarmScheduler();
