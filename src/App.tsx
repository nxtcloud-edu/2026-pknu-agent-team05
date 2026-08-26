/**
 * Outing Route Assistant - Main Application Component
 * Coordinates State, Optimization Engine, Map Visualization, Midway Calculations,
 * Notification Scheduling, Browser Persistence, and In-App Unit Testing.
 */

import { AlertCircle, Calendar, CheckCircle2, Clock, Compass, Navigation, Plus, Sparkles, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { MeetingMidwayModal } from './components/MeetingMidwayModal';
import { Navbar } from './components/Navbar';
import { NotificationBanner } from './components/NotificationBanner';
import { RouteMap } from './components/RouteMap';
import { ScheduleFormModal } from './components/ScheduleFormModal';
import { ScheduleList } from './components/ScheduleList';
import { SettingsModal } from './components/SettingsModal';
import { TimelineView } from './components/TimelineView';
import { UnitTestModal } from './components/UnitTestModal';
import { AppConfig, DEFAULT_APP_CONFIG, STORAGE_KEYS } from './config/appConfig';
import { defaultRouteServiceProvider, KOREAN_LOCATION_PRESETS } from './services/routeServiceBoundary';
import { runAllUnitTests } from './tests/unitTests';
import { Location, OptimizationResult, Participant, ScheduleItem } from './types';
import { defaultAlarmScheduler } from './utils/alarmScheduler';
import { optimizeOutingRoute } from './utils/routeOptimizer';
import { formatLocalDate } from './utils/timeUtils';

export default function App() {
  // 1. Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_DATE);
      if (saved) return saved;
    }
    return formatLocalDate(new Date());
  });

  // 2. Settings / Config State
  const [config, setConfig] = useState<AppConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        try {
          return { ...DEFAULT_APP_CONFIG, ...JSON.parse(saved) };
        } catch {
          // Ignore
        }
      }
    }
    return DEFAULT_APP_CONFIG;
  });

  // 3. Multi-day Schedules Dictionary { "YYYY-MM-DD": ScheduleItem[] }
  const [schedulesMap, setSchedulesMap] = useState<Record<string, ScheduleItem[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore
        }
      }
    }
    return {};
  });

  // Current day's schedules
  const currentSchedules: ScheduleItem[] = schedulesMap[selectedDate] || [];

  // 4. Optimization State
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // 5. Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isMidwayOpen, setIsMidwayOpen] = useState(false);
  const [midwaySchedule, setMidwaySchedule] = useState<ScheduleItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [testPassedCount, setTestPassedCount] = useState<{ passed: number; total: number } | undefined>(undefined);

  // Register Service Worker for offline & background notifications
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered:', reg.scope))
        .catch((err) => console.warn('ServiceWorker registration error:', err));
    }

    // Run baseline unit tests once in background to verify algorithm health
    runAllUnitTests().then((res) => {
      const passed = res.results.filter((r) => r.passed).length;
      setTestPassedCount({ passed, total: res.results.length });
    });
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedulesMap));
  }, [schedulesMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DATE, selectedDate);
  }, [selectedDate]);

  // Run Route Optimization
  const handleRunOptimization = useCallback(async () => {
    if (currentSchedules.length === 0) {
      setOptimizationResult(null);
      defaultAlarmScheduler.clearAllAlarms();
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeOutingRoute({
        originLocation: config.defaultOrigin,
        schedules: currentSchedules,
        defaultBufferMinutes: config.defaultBufferMinutes,
        defaultTransportMode: config.defaultTransportMode,
        startOfDayTime: '09:00',
        returnToOrigin: true,
        provider: defaultRouteServiceProvider,
      });

      setOptimizationResult(result);

      // Re-schedule alarms whenever optimization is completed
      defaultAlarmScheduler.scheduleFromOptimization(result, selectedDate);
    } catch (err) {
      console.error('Route optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  }, [currentSchedules, config, selectedDate]);

  // Automatically trigger optimization when schedules or config change
  useEffect(() => {
    handleRunOptimization();
  }, [selectedDate, schedulesMap, config.defaultBufferMinutes, config.defaultTransportMode]);

  // Schedule CRUD Handlers
  const handleSaveSchedule = (savedSchedule: ScheduleItem) => {
    const existingIdx = currentSchedules.findIndex((s) => s.id === savedSchedule.id);
    let updated: ScheduleItem[];

    if (existingIdx >= 0) {
      updated = [...currentSchedules];
      updated[existingIdx] = savedSchedule;
    } else {
      updated = [...currentSchedules, savedSchedule];
    }

    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDate]: updated,
    }));
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = currentSchedules.filter((s) => s.id !== id);
    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDate]: updated,
    }));
  };

  const handleToggleComplete = (id: string) => {
    const updated = currentSchedules.map((s) =>
      s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDate]: updated,
    }));
  };

  // Preset loaders for quick testing
  const handleLoadPreset = (presetType: 'weekend' | 'business') => {
    let sampleItems: ScheduleItem[] = [];

    if (presetType === 'weekend') {
      sampleItems = [
        {
          id: `preset_${Date.now()}_1`,
          title: '성수 카페거리 브런치',
          location: KOREAN_LOCATION_PRESETS[5], // Seongsu
          durationMinutes: 60,
          type: 'flexible',
        },
        {
          id: `preset_${Date.now()}_2`,
          title: '주말 친구 정기 모임 (점심)',
          location: KOREAN_LOCATION_PRESETS[0], // Gangnam
          durationMinutes: 90,
          type: 'fixed',
          fixedStartTime: '13:00',
          isMeeting: true,
          participants: [
            { id: 'p1', name: '나 (본인)', origin: config.defaultOrigin, travelMode: 'transit' },
            { id: 'p2', name: '김민수 (홍대)', origin: KOREAN_LOCATION_PRESETS[1], travelMode: 'transit' },
            { id: 'p3', name: '이영희 (잠실)', origin: KOREAN_LOCATION_PRESETS[4], travelMode: 'transit' },
          ],
        },
        {
          id: `preset_${Date.now()}_3`,
          title: '코엑스 인터스텔라 전시회',
          location: KOREAN_LOCATION_PRESETS[9], // COEX
          durationMinutes: 70,
          type: 'flexible',
        },
      ];
    } else {
      sampleItems = [
        {
          id: `preset_${Date.now()}_1`,
          title: '정기 치과 검진',
          location: KOREAN_LOCATION_PRESETS[6], // Sadang
          durationMinutes: 40,
          type: 'fixed',
          fixedStartTime: '10:30',
        },
        {
          id: `preset_${Date.now()}_2`,
          title: '서류 발급 및 은행 업무',
          location: KOREAN_LOCATION_PRESETS[0], // Gangnam
          durationMinutes: 30,
          type: 'flexible',
        },
        {
          id: `preset_${Date.now()}_3`,
          title: '파트너사 비즈니스 미팅',
          location: KOREAN_LOCATION_PRESETS[2], // Yeouido
          durationMinutes: 60,
          type: 'fixed',
          fixedStartTime: '15:30',
          isMeeting: true,
          participants: [
            { id: 'p1', name: '나 (본인)', origin: config.defaultOrigin, travelMode: 'transit' },
            { id: 'p2', name: '박대표 (판교)', origin: KOREAN_LOCATION_PRESETS[7], travelMode: 'transit' },
          ],
        },
      ];
    }

    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDate]: sampleItems,
    }));
  };

  const handleConfirmMeetingPlace = (
    scheduleId: string,
    confirmedLocation: Location,
    participants: Participant[]
  ) => {
    const updated = currentSchedules.map((s) => {
      if (s.id === scheduleId) {
        return {
          ...s,
          location: confirmedLocation,
          participants,
        };
      }
      return s;
    });

    setSchedulesMap((prev) => ({
      ...prev,
      [selectedDate]: updated,
    }));
  };

  const handleResetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    setSchedulesMap({});
    setConfig(DEFAULT_APP_CONFIG);
    setOptimizationResult(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenAddModal={() => {
          setEditingSchedule(null);
          setIsFormOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onRunOptimization={handleRunOptimization}
        isOptimizing={isOptimizing}
        scheduleCount={currentSchedules.length}
        isFeasible={optimizationResult?.isFeasible ?? true}
        testPassedCount={testPassedCount}
      />

      {/* 2. Real-time Upcoming Departure Notification Bar */}
      {optimizationResult && optimizationResult.legs.length > 0 && (
        <NotificationBanner legs={optimizationResult.legs} />
      )}

      {/* 3. Main Dashboard Workspace (Responsive Dual/Triple Column) */}
      <main className="mx-auto max-w-7xl flex-1 px-4 sm:px-6 py-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Schedule Management List (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col min-h-[550px]">
            <ScheduleList
              schedules={currentSchedules}
              onEditSchedule={(s) => {
                setEditingSchedule(s);
                setIsFormOpen(true);
              }}
              onDeleteSchedule={handleDeleteSchedule}
              onToggleComplete={handleToggleComplete}
              onOpenMidway={(s) => {
                setMidwaySchedule(s);
                setIsMidwayOpen(true);
              }}
              onOpenAddModal={() => {
                setEditingSchedule(null);
                setIsFormOpen(true);
              }}
              onLoadPreset={handleLoadPreset}
            />
          </div>

          {/* Right Column: Interactive Map & Step-by-Step Optimized Timeline (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Interactive Leaflet Map */}
            <RouteMap
              originLocation={config.defaultOrigin}
              schedules={currentSchedules}
              optimizationResult={optimizationResult}
              activeMeetingParticipants={
                midwaySchedule?.participants ||
                currentSchedules.find((s) => s.isMeeting)?.participants
              }
              activeMidwayPoint={
                currentSchedules.find((s) => s.isMeeting)?.location
              }
            />

            {/* Step-by-Step Optimized Timeline */}
            <div className="flex-1 min-h-[380px]">
              <TimelineView
                optimizationResult={optimizationResult}
                isOptimizing={isOptimizing}
                onRunOptimization={handleRunOptimization}
                baseOriginName={config.defaultOrigin.name}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Modals & Dialogs */}
      {/* Schedule Add / Edit Modal */}
      <ScheduleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveSchedule}
        initialData={editingSchedule}
        onOpenMidwayForSchedule={(draft) => {
          const temp: ScheduleItem = {
            id: editingSchedule?.id || `sched_${Date.now()}`,
            title: draft.title || '새 약속',
            location: draft.location || config.defaultOrigin,
            durationMinutes: draft.durationMinutes || 60,
            type: draft.type || 'flexible',
            fixedStartTime: draft.fixedStartTime,
            isMeeting: true,
            participants: draft.participants || [],
          };
          setIsFormOpen(false);
          setMidwaySchedule(temp);
          setIsMidwayOpen(true);
        }}
      />

      {/* Meeting Midway & Place Recommendation Modal */}
      <MeetingMidwayModal
        isOpen={isMidwayOpen}
        onClose={() => setIsMidwayOpen(false)}
        schedule={midwaySchedule}
        onConfirmPlace={handleConfirmMeetingPlace}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        onResetAllData={handleResetAllData}
      />

      {/* Unit Test & Algorithm Verification Modal */}
      <UnitTestModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
        onTestComplete={(passed, total) => setTestPassedCount({ passed, total })}
      />
    </div>
  );
}
