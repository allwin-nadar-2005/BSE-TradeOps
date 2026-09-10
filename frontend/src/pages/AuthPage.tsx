import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Terminal,
  Building2,
  KeyRound,
  ArrowRight,
  Zap,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoProfile {
  name: string;
  email: string;
  role: string;
  desk: string;
  clientFirm: string;
  badgeColor: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@ashokacapital.in',
    role: 'Lead HFT Execution Trader',
    desk: 'Alpha Equities Desk 01',
    clientFirm: 'Ashoka Capital',
    badgeColor: 'border-brass-500/40 text-brass-400 bg-brass-500/10',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.s@vertexsec.com',
    role: 'Pipeline & Telemetry Engineer',
    desk: 'Ops Core Node 4',
    clientFirm: 'Vertex Securities',
    badgeColor: 'border-teal-400/40 text-teal-400 bg-teal-400/10',
  },
  {
    name: 'Karan Singhania',
    email: 'karan.s@meridian.fin',
    role: 'Head of Compliance & Risk',
    desk: 'SEBI Audit Oversight Desk',
    clientFirm: 'Meridian Advisors',
    badgeColor: 'border-paper-400/40 text-paper-100 bg-ink-700',
  },
];

const LIVE_TICKERS = [
  { symbol: 'RELIANCE', price: 2948.40, change: '+1.42%', up: true },
  { symbol: 'TCS', price: 3824.15, change: '-0.38%', up: false },
  { symbol: 'HDFCBANK', price: 1682.90, change: '+0.85%', up: true },
  { symbol: 'INFY', price: 1740.20, change: '+2.10%', up: true },
  { symbol: 'ICICIBANK', price: 1195.50, change: '-0.15%', up: false },
  { symbol: 'BHARTIARTL', price: 1420.00, change: '+0.95%', up: true },
];

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('arjun.mehta@ashokacapital.in');
  const [password, setPassword] = useState('••••••••••••');
  const [totpToken, setTotpToken] = useState('842910');
  const [rememberDevice, setRememberDevice] = useState(true);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regFirm, setRegFirm] = useState('Ashoka Capital');
  const [regEmail, setRegEmail] = useState('');
  const [regDesk, setRegDesk] = useState('Institutional Desk 02');

  // Simulated live ticker animation
  const [tickerIndex, setTickerIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TICKERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // If already authenticated, redirect to /live
  useEffect(() => {
    if (isAuthenticated && !success) {
      // User is already logged in
    }
  }, [isAuthenticated, success]);

  function handleDemoSelect(profile: DemoProfile) {
    setEmail(profile.email);
    setPassword('TradeOpsSecurePass2026!');
    setTotpToken(String(Math.floor(100000 + Math.random() * 900000)));
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signin') {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both work email and security passkey.');
        return;
      }
    } else {
      if (!regName.trim() || !regEmail.trim()) {
        setErrorMessage('Please complete all institutional operator registration fields.');
        return;
      }
    }

    setLoading(true);

    // Simulate authenticating against institutional LDAP / TLS Auth
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);

      if (mode === 'signin') {
        // Find matching demo or default
        const matched = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
        login({
          name: matched ? matched.name : email.split('@')[0].replace('.', ' '),
          email,
          role: matched ? matched.role : 'Authorized Terminal Operator',
          clientFirm: matched ? matched.clientFirm : 'Institutional Partner Desk',
          desk: matched ? matched.desk : 'Floor Desk 01',
        });
      } else {
        login({
          name: regName,
          email: regEmail,
          role: 'Registered Floor Operator',
          clientFirm: regFirm,
          desk: regDesk,
        });
      }

      setTimeout(() => {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/live';
        navigate(from, { replace: true });
      }, 1200);
    }, 900);
  }

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10 px-2 sm:px-4">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brass-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-ink-600/80 bg-ink-950/80 backdrop-blur-xl shadow-2xl">
        {/* =========================================================================
            LEFT COLUMN: Institutional System Credibility & Live Telemetry Panel
           ========================================================================= */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-b from-ink-900/90 to-ink-950/90 border-b lg:border-b-0 lg:border-r border-ink-600 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #EDEAE0 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          ></div>

          <div className="relative z-10 space-y-6">
            {/* Terminal Security Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-500/10 border border-brass-500/30 text-brass-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-brass-400 animate-ping"></span>
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Institutional Gateway Level 3
              </span>
            </div>

            {/* Brand Header */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brass-500/15 border border-brass-500/40 flex items-center justify-center text-brass-400 shadow-lg shadow-brass-500/10">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-paper-100 tracking-tight">
                    BSE TradeOps
                  </h1>
                  <p className="text-xs text-paper-400 font-mono">
                    High-Throughput Exchange Portal
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-paper-400 leading-relaxed font-sans">
                Real-time operational dashboard for institutional participants. Streaming 4,800+
                chunked BSE live trades with sub-30s connection guarantees.
              </p>
            </div>

            {/* Live Simulated Exchange Ticker Card */}
            <div className="rounded-xl border border-ink-600 bg-ink-900/80 p-3.5 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-paper-400 border-b border-ink-700 pb-2">
                <span className="flex items-center gap-1 text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  EXCHANGE LIVE TICK
                </span>
                <span>FEED: REALTIME PUSH</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LIVE_TICKERS.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.symbol}
                    className={`p-2 rounded-lg border transition-all duration-500 ${
                      idx === tickerIndex % 4
                        ? 'border-brass-500/50 bg-ink-700/60 shadow-sm'
                        : 'border-ink-700 bg-ink-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-paper-100">{item.symbol}</span>
                      <span className={item.up ? 'text-teal-400' : 'text-clay-400'}>
                        {item.change}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-paper-100 mt-1">
                      ₹{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Architectural Guarantees */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-paper-400">
                <Clock className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-paper-100 font-medium">Under 30s Ceiling Enforced:</span>{' '}
                  Chunked requests with automatic backoff resilience.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-paper-400">
                <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-paper-100 font-medium">Zero Client Polling:</span> Live
                  state dispatched via Supabase Postgres Realtime.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-paper-400">
                <Fingerprint className="w-4 h-4 text-brass-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-paper-100 font-medium">SEBI Regulated Protocol:</span>{' '}
                  256-bit institutional encrypted operator session.
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Seal */}
          <div className="relative z-10 pt-6 mt-6 border-t border-ink-700 flex items-center justify-between text-[11px] font-mono text-paper-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>TLS 1.3 / Hardware 2FA</span>
            </div>
            <span>BSE Terminal ID: #4000</span>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Interactive Operator Authentication Form
           ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between relative">
          <div>
            {/* Tab Mode Switcher */}
            <div className="flex items-center justify-between border-b border-ink-600 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="auth-tab-signin"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    mode === 'signin'
                      ? 'bg-brass-500/15 text-brass-400 border border-brass-500/40 shadow-sm'
                      : 'text-paper-400 hover:text-paper-100'
                  }`}
                >
                  Operator Sign In
                </button>
                <button
                  type="button"
                  id="auth-tab-register"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    mode === 'register'
                      ? 'bg-brass-500/15 text-brass-400 border border-brass-500/40 shadow-sm'
                      : 'text-paper-400 hover:text-paper-100'
                  }`}
                >
                  Request Desk Access
                </button>
              </div>

              <span className="text-[11px] font-mono text-paper-400 hidden sm:inline-block">
                Secure SSL Session
              </span>
            </div>

            {/* One-Click Demo Fill Profiles Header */}
            {mode === 'signin' && (
              <div className="mb-6 p-3.5 rounded-xl bg-ink-900 border border-ink-600 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-brass-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>QUICK DEMO ACCESS (1-CLICK LOAD)</span>
                  </div>
                  <span className="text-[10px] text-paper-400 font-mono">Select a Desk</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEMO_PROFILES.map((prof) => (
                    <button
                      key={prof.email}
                      type="button"
                      id={`demo-btn-${prof.clientFirm.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleDemoSelect(prof)}
                      className="text-left p-2 rounded-lg bg-ink-800 hover:bg-ink-700 border border-ink-600 hover:border-brass-500/40 transition-all group"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-paper-100 group-hover:text-brass-400">
                        <span>{prof.clientFirm}</span>
                      </div>
                      <div className="text-[10px] text-paper-400 truncate">{prof.name}</div>
                      <div className="text-[9px] font-mono text-teal-400 mt-0.5 truncate">
                        {prof.role}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alert / Error display */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-clay-400/10 border border-clay-400/30 flex items-center gap-2 text-clay-400 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success state celebration */}
            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-teal-400/20 border border-teal-400/40 flex items-center justify-center text-teal-400 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-paper-100">
                    Authentication Confirmed
                  </h3>
                  <p className="text-xs text-paper-400 font-mono">
                    Initializing real-time terminal stream session...
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-ink-800 border border-ink-600 text-xs font-mono text-teal-400">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                  Redirecting to Live Operations Terminal...
                </div>
              </div>
            ) : (
              /* The Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signin' ? (
                  <>
                    {/* Work Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="auth-email"
                        className="block text-xs font-mono font-medium text-paper-400"
                      >
                        Institutional Operator Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="auth-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="operator@brokerage.in"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Security Passkey */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="auth-password"
                          className="block text-xs font-mono font-medium text-paper-400"
                        >
                          Terminal Passkey
                        </label>
                        <a
                          href="#help"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(
                              'In demo mode, click any of the 3 Quick Demo Fill cards above to automatically populate valid credentials!'
                            );
                          }}
                          className="text-[11px] font-mono text-brass-400 hover:underline"
                        >
                          Need Access Key?
                        </a>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                        />
                        <button
                          type="button"
                          id="auth-toggle-pwd"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-paper-400 hover:text-paper-100"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* TOTP 2FA Token (Optional simulation) */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="auth-totp"
                        className="block text-xs font-mono font-medium text-paper-400 flex items-center justify-between"
                      >
                        <span>Hardware Token / SEBI TOTP Code</span>
                        <span className="text-[10px] text-teal-400">Hardware Synced</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="auth-totp"
                          type="text"
                          maxLength={6}
                          value={totpToken}
                          onChange={(e) => setTotpToken(e.target.value)}
                          placeholder="6-digit TOTP"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono tracking-widest focus:outline-none focus:border-brass-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Remember Device & Session Settings */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-paper-400 select-none">
                        <input
                          type="checkbox"
                          id="auth-remember-device"
                          checked={rememberDevice}
                          onChange={(e) => setRememberDevice(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-ink-900 border-ink-600 text-brass-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>Remember authorized trading workstation</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Operator Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-name"
                        className="block text-xs font-mono font-medium text-paper-400"
                      >
                        Authorized Operator Full Name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Vikram Malhotra"
                        className="w-full px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                      />
                    </div>

                    {/* Institutional Firm Dropdown */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-firm"
                        className="block text-xs font-mono font-medium text-paper-400"
                      >
                        Institutional Brokerage / AMC
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-paper-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <select
                          id="reg-firm"
                          value={regFirm}
                          onChange={(e) => setRegFirm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                        >
                          <option value="Ashoka Capital">Ashoka Capital</option>
                          <option value="Vertex Securities">Vertex Securities</option>
                          <option value="Meridian Advisors">Meridian Advisors</option>
                          <option value="Northgate Fund">Northgate Fund</option>
                          <option value="Silverline Partners">Silverline Partners</option>
                          <option value="Crown Point Holdings">Crown Point Holdings</option>
                          <option value="Blue Harbor AMC">Blue Harbor AMC</option>
                          <option value="Ridgeline Trading">Ridgeline Trading</option>
                          <option value="Anchor Point Investments">Anchor Point Investments</option>
                          <option value="Delta Bridge Capital">Delta Bridge Capital</option>
                        </select>
                      </div>
                    </div>

                    {/* Work Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-email"
                        className="block text-xs font-mono font-medium text-paper-400"
                      >
                        Institutional Corporate Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="v.malhotra@firm.in"
                        className="w-full px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                      />
                    </div>

                    {/* Desk Code */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-desk"
                        className="block text-xs font-mono font-medium text-paper-400"
                      >
                        Trading Desk Assignment
                      </label>
                      <input
                        id="reg-desk"
                        type="text"
                        value={regDesk}
                        onChange={(e) => setRegDesk(e.target.value)}
                        placeholder="Institutional Equities Desk 02"
                        className="w-full px-3 py-2.5 rounded-lg bg-ink-900 border border-ink-600 text-paper-100 placeholder-paper-400/40 text-xs font-mono focus:outline-none focus:border-brass-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-400 hover:to-brass-500 text-ink-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brass-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Security Clearance...</span>
                    </>
                  ) : mode === 'signin' ? (
                    <>
                      <span>Enter Trade Operations Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Request Terminal Operator Clearance</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Bottom Terminal Notice */}
          <div className="mt-8 pt-4 border-t border-ink-700/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-paper-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>256-Bit Financial Encryption</span>
            </div>
            <div className="text-center sm:text-right">
              <span>Zero client polling • Supabase Realtime active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
