import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind CSS v4 방식 — 플러그인만 등록하고 CSS 에서 @import "tailwindcss" 한 줄.
// tailwind.config.js 와 PostCSS 설정 파일을 두지 않는다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // 계산 요소만 검증한다 (Q5-A · Q3-B). 화면 테스트가 없으므로 DOM 환경이 필요 없다.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
