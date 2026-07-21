function LicenseCheckingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b1f24] relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#2699aa] opacity-[0.12] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#1a6b7a] opacity-[0.15] blur-[120px]" />

      <div className="relative flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2699aa] to-[#1a6b7a] flex items-center justify-center shadow-lg shadow-[#1a6b7a]/30 mb-6">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="10" rx="2" stroke="white" strokeWidth="1.8" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        <svg className="animate-spin mb-4" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#2699aa" strokeWidth="2.5" strokeOpacity="0.2" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#2699aa" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        <p className="text-[#8fa6ab] text-sm tracking-wide">Checking license...</p>
      </div>
    </div>
  )
}

export default LicenseCheckingScreen
