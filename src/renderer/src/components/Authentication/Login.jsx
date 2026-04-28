import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'

const LoginPage = () => {
  const { username, setUsername, password, setPassword, error, fieldErrors, loading, bootstrapMessage, handleLogin } =
    useLogin()

  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#225166] overflow-hidden font-['Segoe_UI',sans-serif]">
      {/* Background */}
      <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-[4px] px-14 pt-12 pb-9 w-full max-w-[580px] h-[460px] shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
        <form onSubmit={handleLogin}>
          {bootstrapMessage && (
            <div className="mb-4 rounded-[4px] border border-[#bfe3ea] bg-[#eef9fb] px-3 py-2 text-[13px] text-[#1a6b7a]">
              {bootstrapMessage}
            </div>
          )}

          {/* Username */}
          <div className="mb-[10px]">
            <label className="text-[15px] text-[#222] mb-2 block">Username</label>
            <input
              className="w-full border-0 border-b border-b-[#ccc] border-solid outline-none text-[15px] py-1.5 px-0 bg-transparent"
              type="email"
              placeholder="alphadevs.user@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {fieldErrors.username && (
              <div className="text-[#c0392b] text-[13px] mt-1.5">{fieldErrors.username}</div>
            )}
          </div>

          {/* Reset Password */}
          <div className="flex justify-end mb-5">
            <Link to="/reset-password" className="bg-transparent border-0 text-[#1a6b7a] cursor-pointer text-[14px] no-underline">
              Reset Password
            </Link>
          </div>

          {/* Password */}
          <div className="mb-[10px]">
            <label className="text-[15px] text-[#222] mb-2 block">Password</label>

            <div className="relative">
              <input
                className="w-full border-0 border-b border-b-[#ccc] border-solid outline-none text-[15px] py-1.5 px-0 pr-9 bg-transparent"
                type={showPassword ? 'text' : 'password'}
                placeholder="x x x x x x x x"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {fieldErrors.password && (
              <div className="text-[#c0392b] text-[13px] mt-1.5">{fieldErrors.password}</div>
            )}
          </div>

          {/* Global Error */}
          {error && <div className="text-[#c0392b] text-[13px] mt-1.5">{error}</div>}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3.5 mt-[25px] bg-[#1a6b7a] text-white border-0 rounded-[3px] text-[16px] cursor-pointer disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-[25px] text-[13px] text-[#777]">
          Powered by <strong>Alpha Devs</strong>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
