// 화면에서 되풀이되는 조각들
// 근거: frontend-components.md
//
// 계산식을 갖지 않는다. 받은 값을 그리기만 한다 (NFR-5.3).

import type { ReactNode } from 'react'

export function Panel({
  title,
  description,
  onClose,
  children,
  footer,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="panel-enter rounded-2xl border border-ink-200 bg-white shadow-lg shadow-ink-900/5">
      <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {description !== undefined && (
            <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          title="닫기"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <div className="px-5 py-5">{children}</div>
      {footer !== undefined && (
        <footer className="flex justify-end gap-2 border-t border-ink-100 bg-ink-50 px-5 py-3.5">
          {footer}
        </footer>
      )}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        {hint !== undefined && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      {children}
      {error !== undefined && (
        <p className="fade-enter flex items-start gap-1.5 text-xs text-red-600">
          <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.5h1.5v5h-1.5v-5zm0 6.25h1.5v1.5h-1.5v-1.5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:ring-2'

export function TextInput({
  value,
  onChange,
  placeholder,
  invalid = false,
  type = 'text',
  min,
  max,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  type?: 'text' | 'time' | 'number' | 'date'
  min?: number | string
  max?: number | string
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputBase} ${
        invalid
          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
          : 'border-ink-200 focus:border-ink-400 focus:ring-ink-100'
      }`}
    />
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { readonly value: T; readonly label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-ink-200 bg-ink-50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition ${
            value === option.value
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles: Record<string, string> = {
    primary: 'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-300',
    ghost: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
    subtle: 'text-ink-500 hover:bg-ink-100 hover:text-ink-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

/** 알려야 하는 것 — 안내 · 주의 · 막힘 */
export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'recurring'
  title?: string
  children: ReactNode
}) {
  const tones: Record<string, string> = {
    info: 'border-ink-200 bg-ink-50 text-ink-600',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    recurring: 'border-violet-200 bg-violet-50 text-violet-800',
  }

  return (
    <div className={`fade-enter rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {title !== undefined && <p className="mb-0.5 font-semibold">{title}</p>}
      {children}
    </div>
  )
}

/** 반복에서 온 일정임을 나타내는 표시 */
export function RecurringMark() {
  return (
    <span title="반복 일정" className="text-violet-500">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9" strokeLinecap="round" />
        <path d="M11.5 1.8v2.7h-2.7M4.5 14.2v-2.7h2.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** 시간 고정형 / 유연형 표시 — S-2 수락 기준 (구분되어 보여야 한다) */
export function KindMark({ kind }: { kind: 'fixed' | 'flexible' }) {
  if (kind === 'fixed') {
    return (
      <span title="시간 고정형" className="text-ink-500">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.8V8l2.2 1.6" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  return (
    <span title="유연형 — 아무 때나" className="text-ink-300">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" strokeDasharray="2.5 2.5" />
      </svg>
    </span>
  )
}
