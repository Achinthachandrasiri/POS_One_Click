import { vi } from 'vitest'

// Only set up window.api in jsdom environment (hooks tests)
if (typeof window !== 'undefined') {
  window.api = {
    auth: {
      login: vi.fn(),
      sendOtp: vi.fn(),
      verifyOtp: vi.fn(),
      changePassword: vi.fn()
    }
  }
}
