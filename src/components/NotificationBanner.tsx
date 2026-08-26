/**
 * Upcoming Departure Notification Banner & Permission Banner
 */

import { Bell, BellOff, Check, Clock, Navigation, Volume2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { RouteLeg } from '../types';
import { minutesToTimeString, timeStringToMinutes } from '../utils/timeUtils';

interface NotificationBannerProps {
  legs: RouteLeg[];
  onDismiss?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ legs }) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    const updateNow = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    updateNow();
    const interval = setInterval(updateNow, 30000);
    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setPermissionState(res);
      if (res === 'granted') {
        new Notification('외출 알림이 활성화되었습니다!', {
          body: '출발 시각이 되면 여유 시간을 계산하여 실시간 알림을 보냅니다.',
        });
      }
    }
  };

  // Find next upcoming departure leg
  const nextLeg = legs.find((l) => {
    if (!l.scheduleItem) return false;
    const depMin = timeStringToMinutes(l.departureTime);
    return depMin >= nowMinutes - 10; // within 10 min past or future
  });

  if (isDismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3 space-y-2">
      {/* Permission Request Banner if default */}
      {permissionState === 'default' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#E5E1DA] bg-[#F9F8F6] px-4 py-3 text-xs text-[#1A1A1A] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-[#E63946] shrink-0" />
            <span>
              <strong className="font-bold">출발 알림 설정:</strong> 브라우저 알림을 허용하시면 일정 출발 시각에 맞춰 잊지 않도록 정시 출발 알림을 보내드립니다.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestPermission}
              className="border border-[#1A1A1A] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 active:scale-95 transition-all shadow-2xs"
            >
              알림 권한 허용
            </button>
          </div>
        </div>
      )}

      {/* Next Upcoming Departure Alert Card if exists */}
      {nextLeg && nextLeg.scheduleItem && (
        <div className="flex items-center justify-between border border-[#1A1A1A] bg-[#1A1A1A] px-4 py-3 text-xs text-white shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-7 w-7 items-center justify-center bg-[#E63946] text-white font-bold shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-xs text-[#B5AFA2] font-bold mr-1.5">다음 출발 예정:</span>
              <span className="font-bold text-white mr-1.5">[{nextLeg.scheduleItem.title}]</span>
              <span className="text-[#E5E1DA] font-mono text-xs">
                {nextLeg.departureTime} 출발 (이동 {nextLeg.travelDurationMinutes}분, 여유 {nextLeg.bufferMinutes}분)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="border border-[#E63946]/40 bg-[#E63946]/20 px-2 py-0.5 text-xs font-mono font-bold text-[#E63946]">
              출발 대기
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
