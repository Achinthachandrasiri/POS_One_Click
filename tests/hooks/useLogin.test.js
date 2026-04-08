// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLogin } from '../../src/renderer/src/hooks/useLogin'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

const mockLogin = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockLogin.mockReset()

  Object.defineProperty(window, 'api', {
    value: {
      auth: {
        login: mockLogin
      }
    },
    writable: true,
    configurable: true
  })
})

// ── Validation ─────────────────────────────────────────────────────────────────

describe('useLogin — validation', () => {
  it('sets fieldError when username is empty', async () => {
    const { result } = renderHook(() => useLogin())
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })
    expect(result.current.fieldErrors.username).toBe('Username is required')
  })

  it('sets fieldError for non-gmail username', async () => {
    const { result } = renderHook(() => useLogin())
    act(() => result.current.setUsername('user@yahoo.com'))
    act(() => result.current.setPassword('password123'))
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })
    expect(result.current.fieldErrors.username).toMatch(/gmail/i)
  })

  it('sets fieldError when password is too short', async () => {
    const { result } = renderHook(() => useLogin())
    act(() => result.current.setUsername('user@gmail.com'))
    act(() => result.current.setPassword('short'))
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })
    expect(result.current.fieldErrors.password).toMatch(/8 characters/i)
  })
})

// ── API Interaction ────────────────────────────────────────────────────────────

describe('useLogin — API interaction', () => {
  it('calls window.api.auth.login with trimmed credentials', async () => {
    mockLogin.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useLogin())

    act(() => result.current.setUsername('  user@gmail.com  '))
    act(() => result.current.setPassword('  password123  '))
    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'user@gmail.com', password: 'password123' })
    )
  })

  it('sets fieldErrors from API response on failure', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      fieldErrors: { password: 'Incorrect password. 4 attempt(s) remaining before lockout.' }
    })
    const { result } = renderHook(() => useLogin())
    act(() => result.current.setUsername('user@gmail.com'))
    act(() => result.current.setPassword('wrongpassword'))

    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })
    expect(result.current.fieldErrors.password).toMatch(/attempt/i)
  })

  it('sets general error when API throws', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useLogin())
    act(() => result.current.setUsername('user@gmail.com'))
    act(() => result.current.setPassword('password123'))

    await act(async () => {
      await result.current.handleLogin({ preventDefault: vi.fn() })
    })
    expect(result.current.error).toMatch(/something went wrong/i)
  })

  it('shows loading state during API call', async () => {
    let resolve
    mockLogin.mockReturnValue(new Promise(r => (resolve = r)))
    const { result } = renderHook(() => useLogin())
    act(() => result.current.setUsername('user@gmail.com'))
    act(() => result.current.setPassword('password123'))

    act(() => { result.current.handleLogin({ preventDefault: vi.fn() }) })
    expect(result.current.loading).toBe(true)

    await act(async () => resolve({ success: true }))
    expect(result.current.loading).toBe(false)
  })
})
