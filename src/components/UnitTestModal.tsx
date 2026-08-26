/**
 * Interactive Unit Test Runner Dashboard
 * Executes all boundary, algorithm, performance, and clock-injected tests live in-app.
 */

import { AlertCircle, CheckCircle2, Clock, FlaskConical, Play, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { runAllUnitTests } from '../tests/unitTests';
import { TestResult } from '../types';

interface UnitTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestComplete?: (passed: number, total: number) => void;
}

export const UnitTestModal: React.FC<UnitTestModalProps> = ({
  isOpen,
  onClose,
  onTestComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [totalDurationMs, setTotalDurationMs] = useState(0);

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const { results, allPassed: passed, totalDurationMs: duration } = await runAllUnitTests();
      setTestResults(results);
      setAllPassed(passed);
      setTotalDurationMs(duration);
      if (onTestComplete) {
        const passedCount = results.filter((r) => r.passed).length;
        onTestComplete(passedCount, results.length);
      }
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] border border-[#E5E1DA] bg-[#FDFCFB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1DA] bg-[#F9F8F6] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
                알고리즘 및 단위 테스트 검증 센터
              </h2>
              <p className="text-[11px] text-[#8C8273] font-medium">
                동선 최적화, 중간지점 분산 최소화, 시각 주입 알림 등 핵심 엔진 독립 검증
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8C8273] hover:text-[#1A1A1A] hover:bg-[#E5E1DA]/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between border-b border-[#E5E1DA] bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            {allPassed === true ? (
              <span className="flex items-center gap-1.5 border border-[#2A9D8F] bg-[#2A9D8F]/10 px-3 py-1 text-xs font-bold text-[#2A9D8F]">
                <CheckCircle2 className="h-4 w-4 text-[#2A9D8F]" />
                모든 테스트 통과 ({passedCount}/{testResults.length})
              </span>
            ) : allPassed === false ? (
              <span className="flex items-center gap-1.5 border border-[#E63946] bg-[#E63946]/10 px-3 py-1 text-xs font-bold text-[#E63946]">
                <AlertCircle className="h-4 w-4 text-[#E63946]" />
                테스트 실패 발생 ({passedCount}/{testResults.length})
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#8C8273]">테스트 러너 준비 중...</span>
            )}

            <span className="text-xs text-[#8C8273] font-mono">
              소요 시간: <strong>{totalDurationMs}ms</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={executeTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 active:scale-98 disabled:opacity-50 transition-all shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>테스트 재실행</span>
          </button>
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 bg-[#F9F8F6]">
          {testResults.map((t, idx) => (
            <div
              key={t.id}
              className={`border p-4 transition-all ${
                t.passed
                  ? 'border-[#E5E1DA] border-l-4 border-l-[#2A9D8F] bg-white shadow-2xs'
                  : 'border-[#E63946]/40 border-l-4 border-l-[#E63946] bg-white shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {t.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#2A9D8F]" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[#E63946]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        {idx + 1}. {t.name}
                      </span>
                      <span className="border border-[#E5E1DA] bg-[#F9F8F6] px-1.5 py-0.2 text-[10px] font-mono text-[#8C8273]">
                        {t.durationMs}ms
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#8C8273]">{t.description}</p>
                    {t.error && (
                      <div className="mt-2 border border-[#E63946]/30 bg-[#E63946]/10 p-2 text-xs font-mono text-[#E63946]">
                        오류 내용: {t.error}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                    t.passed
                      ? 'border-[#2A9D8F]/40 bg-[#2A9D8F]/15 text-[#2A9D8F]'
                      : 'border-[#E63946]/40 bg-[#E63946]/15 text-[#E63946]'
                  }`}
                >
                  {t.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#E5E1DA] bg-[#F9F8F6] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#1A1A1A] bg-[#1A1A1A] px-5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
