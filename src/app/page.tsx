"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  FlaskConical,
  FileText,
  Layers,
  ShieldCheck,
  GitBranch,
  AlertTriangle,
  Download,
  ChevronRight,
} from "lucide-react"

/* ─── Typewriter Hook ─── */
function useTypewriter(text: string, speed = 80) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(timer)
        setTimeout(() => setDone(true), 1800)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return { displayed, done }
}

/* ─── Count-Up Hook ─── */
function useCountUp(target: number, duration = 1200, active = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, active])

  return count
}

/* ─── Intersection Observer Hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

/* ─── Metrics Bar ─── */
const METRICS = [
  { num: 10, suffix: "x", label: "Faster QA Review" },
  { num: 50, suffix: "x", label: "Lower Cost" },
  { num: 100, suffix: "%", label: "Digital Audit Trail" },
  { num: 0, suffix: "", label: "Paper Records" },
]

function MetricItem({ num, suffix, label, active }: { num: number; suffix: string; label: string; active: boolean }) {
  const count = useCountUp(num, 1200, active)
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 border-r border-[#EAEAEA] last:border-r-0">
      <span className="text-4xl font-bold tracking-tight text-[#000] count-up">
        {count}{suffix}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-[2px] text-[#555] mt-1">{label}</span>
    </div>
  )
}

/* ─── Features ─── */
const FEATURES = [
  {
    icon: FileText,
    title: "Master Batch Records",
    desc: "Build reusable MBR templates. One-click batch creation.",
  },
  {
    icon: Layers,
    title: "Guided Execution",
    desc: "Step-by-step operator guidance with real-time validation.",
  },
  {
    icon: ShieldCheck,
    title: "3-Stage QA Review",
    desc: "Structured digital sign-off. AI summaries included.",
  },
  {
    icon: GitBranch,
    title: "Immutable Audit Trail",
    desc: "Append-only logs. 21 CFR Part 11 compliant.",
  },
  {
    icon: AlertTriangle,
    title: "Deviation Management",
    desc: "Inline CAPA workflow with root cause analysis.",
  },
  {
    icon: Download,
    title: "PDF Export",
    desc: "Print-ready regulatory submissions in one click.",
  },
]

/* ─── Roles ─── */
const ROLES = [
  {
    title: "Production Head",
    badge: "Management",
    perms: ["MBR approval & sign-off", "Batch oversight & status", "Yield trend analysis", "Line clearance approval"],
  },
  {
    title: "Supervisor",
    badge: "Operations",
    perms: ["Batch initiation", "Step verification & countersign", "Equipment check", "Deviation escalation"],
  },
  {
    title: "Operator",
    badge: "Execution",
    perms: ["Guided step execution", "Real-time data entry", "Electronic signatures (PIN)", "Inline deviation logging"],
  },
  {
    title: "QA Reviewer",
    badge: "Quality",
    perms: ["Batch record review", "Deviation flagging", "Checklist sign-off", "Exception reports"],
  },
  {
    title: "QA Head",
    badge: "Release",
    perms: ["Final batch release/rejection", "AI summary review", "CAPA approval", "Regulatory signatory"],
  },
  {
    title: "Admin",
    badge: "System",
    perms: ["User management", "Org settings", "Full audit trail access", "Master data control"],
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [metricsActive, setMetricsActive] = useState(false)
  const [heroScrolled, setHeroScrolled] = useState(false)
  const { ref: featuresRef, visible: featuresVisible } = useReveal()
  const { ref: rolesRef, visible: rolesVisible } = useReveal()
  const { ref: ctaRef, visible: ctaVisible } = useReveal()
  const { displayed, done: typewriterDone } = useTypewriter("Digital Batch Records.\nZero Compromise.", 75)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMetricsActive(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (metricsRef.current) obs.observe(metricsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current
      if (hero) setHeroScrolled(window.scrollY > hero.offsetHeight * 0.6)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Staggered word reveal for body text
  const bodyText = "Replace paper-based batch records with AI-assisted eBMR. Reduce QA review from days to hours—at a fraction of enterprise cost."
  const words = bodyText.split(" ")

  return (
    <div className="min-h-screen bg-white text-black font-sans landing-page-enter overflow-x-hidden">

      {/* ─── Nav ─── */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: heroScrolled ? "rgba(255,255,255,0.95)" : "transparent",
          backdropFilter: heroScrolled ? "blur(12px)" : "none",
          borderBottom: heroScrolled ? "1px solid #EAEAEA" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">MoonPharma eBMR</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#555] hover:text-black transition-colors duration-150"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-lg hover:bg-[#222] transition-colors duration-150"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          opacity: heroScrolled ? 0.15 : 1,
          transform: heroScrolled ? "translateY(-20px)" : "translateY(0)",
          transition: "opacity 400ms ease-out, transform 400ms ease-out",
        }}
      >
        {/* Drifting grid background */}
        <div className="hero-grid-bg absolute inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full pt-20 pb-24">
          <div className="grid lg:grid-cols-[60%_40%] gap-16 items-center">

            {/* Left: Content */}
            <div className="space-y-8">
              {/* Compliance badge */}
              <div
                className="inline-flex items-center gap-2 text-[11px] font-medium text-[#555] border border-[#EAEAEA] px-3 py-1.5 rounded-full"
                style={{ animation: "fadeInUp 500ms 200ms ease-out both" }}
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="tracking-[2px] uppercase">FDA 21 CFR Part 11 · ALCOA+ · GMP Ready</span>
              </div>

              {/* H1: Typewriter */}
              <h1
                className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[#000]"
                style={{ minHeight: "2.4em" }}
              >
                {displayed.split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                    {i === displayed.split("\n").length - 1 && !typewriterDone && (
                      <span className="typewriter-cursor" />
                    )}
                  </span>
                ))}
              </h1>

              {/* Body: staggered word reveal */}
              {typewriterDone && (
                <p
                  className="text-lg text-[#222] leading-relaxed max-w-lg"
                  style={{ animation: "fadeInUp 500ms ease-out both" }}
                >
                  {words.map((word, i) => (
                    <span
                      key={i}
                      className="inline-block"
                      style={{
                        animation: `fadeInUp 400ms ${i * 30}ms ease-out both`,
                        marginRight: "0.25em",
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              )}

              {/* CTAs */}
              {typewriterDone && (
                <div
                  className="flex flex-col gap-4 w-fit"
                  style={{ animation: "fadeInUp 500ms 200ms ease-out both" }}
                >
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 bg-black text-white px-8 h-11 rounded-xl text-sm font-semibold hover:bg-[#222] transition-colors duration-150"
                  >
                    Start Free Trial
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 bg-white text-black border border-black px-8 h-11 rounded-xl text-sm font-semibold hover:bg-[#000] hover:text-white transition-colors duration-150"
                  >
                    Sign In →
                  </Link>
                  <span className="text-xs text-[#888] italic text-center">No credit card required</span>
                </div>
              )}
            </div>

            {/* Right: Abstract visual */}
            <div
              className="hidden lg:flex items-center justify-center"
              style={{ animation: "fadeIn 1s 1s ease-out both" }}
            >
              <AbstractVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metrics Bar (sticky) ─── */}
      <div
        ref={metricsRef}
        className="sticky top-0 z-40 bg-white/90 border-b border-[#EAEAEA]"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-4">
          {METRICS.map((m) => (
            <MetricItem key={m.label} {...m} active={metricsActive} />
          ))}
        </div>
      </div>

      {/* ─── Features Grid ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            ref={featuresRef as React.RefObject<HTMLDivElement>}
            className={`text-center mb-16 reveal ${featuresVisible ? "revealed" : ""}`}
          >
            <h2 className="text-4xl font-bold tracking-tight text-[#000] mb-4">
              Everything pharma manufacturing needs
            </h2>
            <p className="text-[#555] text-base max-w-xl mx-auto leading-relaxed">
              Built for mid-size pharmaceutical manufacturers who need compliance without the enterprise price tag.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 100} visible={featuresVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles Section ─── */}
      <section className="py-20 px-6 border-t border-[#EAEAEA]">
        <div className="max-w-6xl mx-auto">
          <div
            ref={rolesRef as React.RefObject<HTMLDivElement>}
            className={`text-center mb-12 reveal ${rolesVisible ? "revealed" : ""}`}
          >
            <h2 className="text-4xl font-bold tracking-tight text-[#000] mb-4">Built for every role</h2>
            <p className="text-[#555] text-base">
              Role-based access so every team member sees exactly what they need.
            </p>
          </div>

          {/* Snap-scroll horizontal on desktop */}
          <div
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {ROLES.map((r, i) => (
              <RoleCard key={r.title} {...r} delay={i * 80} visible={rolesVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        ref={ctaRef as React.RefObject<HTMLDivElement>}
        className="relative overflow-hidden noise-bg"
        style={{ background: "#000", minHeight: "400px" }}
      >
        <div
          className={`relative z-10 flex flex-col items-center justify-center text-center px-6 py-32 reveal ${ctaVisible ? "revealed" : ""}`}
        >
          <h2 className="text-5xl font-bold text-white mb-4 cta-headline">Go Paperless Today.</h2>
          <p className="text-[#888] text-lg mb-10 max-w-lg leading-relaxed">
            Sign up in 2 minutes. Start executing batches immediately.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-black px-10 h-12 rounded-xl text-sm font-semibold hover:bg-black hover:text-white border border-white transition-colors duration-150"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#EAEAEA] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-[120px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
              <FlaskConical className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#000]">MoonPharma eBMR</p>
              <p className="text-[11px] text-[#555]">AI-powered pharma compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Support"].map((link) => (
              <a key={link} href="#" className="footer-link text-sm text-[#555] hover:text-[#000] transition-colors duration-150">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── Feature Card Component ─── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
  visible,
}: {
  icon: React.ElementType
  title: string
  desc: string
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={`feature-card p-8 rounded-2xl border border-[#EAEAEA] bg-white cursor-default reveal ${visible ? "revealed" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl border border-[#EAEAEA] flex items-center justify-center mb-6 feature-icon">
        <Icon className="w-5 h-5 text-[#000]" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-[#000] mb-2">{title}</h3>
      <p className="text-sm text-[#555] leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Role Card Component ─── */
function RoleCard({
  title,
  badge,
  perms,
  delay,
  visible,
}: {
  title: string
  badge: string
  perms: string[]
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={`role-card flex-none w-[300px] bg-white border border-black rounded-2xl p-8 snap-start reveal ${visible ? "revealed" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-5">
        <p className="text-xl font-bold text-[#000]">{title}</p>
        <p className="text-[10px] uppercase tracking-[2px] text-[#888] mt-0.5">{badge}</p>
      </div>
      <ul className="space-y-2">
        {perms.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-[#555]">
            <span className="w-1 h-1 rounded-full bg-[#000] mt-2 flex-shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Abstract Paper-to-Pixel Visual ─── */
function AbstractVisual() {
  // Isometric cube vertices centered at (200, 210)
  // side = 68, iso horizontal = 68 * cos(30°) ≈ 59, iso vertical-half = 68 * sin(30°) = 34
  const cx = 200, cy = 210
  const hw = 59, hh = 34, ch = 66

  // Top face diamond
  const top    = [cx, cy - hh - ch] as [number, number]       // (200, 110)
  const right  = [cx + hw, cy - ch] as [number, number]       // (259, 144)
  const front  = [cx, cy - ch + hh] as [number, number]       // (200, 178)
  const left   = [cx - hw, cy - ch] as [number, number]       // (141, 144)
  // Bottom ring (top face + ch downward)
  const frontB = [front[0], front[1] + ch] as [number, number] // (200, 244)
  const rightB = [right[0], right[1] + ch] as [number, number] // (259, 210)
  const leftB  = [left[0],  left[1]  + ch] as [number, number] // (141, 210)

  const pts = (arr: [number, number][]) => arr.map(p => p.join(",")).join(" ")

  return (
    <svg
      viewBox="0 0 400 400"
      width="370"
      height="370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polyline points="0,0 6,3 0,6" fill="none" stroke="#888" strokeWidth="1.2" />
        </marker>
        <style>{`
          @keyframes svgFadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
          @keyframes svgFloat   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-9px) } }
          @keyframes svgDraw    { to { stroke-dashoffset:0 } }
          @keyframes svgNodePop { 0% { r:0; opacity:0 } 70% { r:4 } 100% { r:2.5; opacity:1 } }

          .sv-paper   { animation: svgFadeUp 700ms ease-out both }
          .sv-p1      { animation-delay: 50ms }
          .sv-p2      { animation-delay: 200ms }
          .sv-p3      { animation-delay: 350ms }

          .sv-cube    { animation: svgFloat 5s ease-in-out 2s infinite }
          .sv-face    { stroke-dashoffset:480; animation: svgDraw 1.4s ease-out 900ms forwards }
          .sv-face-l  { animation-delay: 1050ms }
          .sv-face-r  { animation-delay: 1200ms }

          .sv-arrow1  { stroke-dashoffset:90; animation: svgDraw 500ms ease-out 500ms forwards }
          .sv-arrow2  { stroke-dashoffset:90; animation: svgDraw 500ms ease-out 1600ms forwards }

          .sv-node    { animation: svgNodePop 350ms ease-out both }
          .sv-gl      { opacity:0; animation: svgFadeUp 300ms ease-out both }
        `}</style>
      </defs>

      {/* ── Corner marks ── */}
      <g stroke="#E0E0E0" strokeWidth="1">
        <polyline points="14,34 14,14 34,14" />
        <polyline points="386,34 386,14 366,14" />
        <polyline points="14,366 14,386 34,386" />
        <polyline points="386,366 386,386 366,386" />
      </g>

      {/* ── Paper stack (bottom-left) ── */}
      <g transform="translate(22, 242)">
        {/* depth shadow sheets */}
        <rect className="sv-paper sv-p3" x="10" y="10" width="104" height="130" rx="6"
          fill="white" stroke="#D8D8D8" strokeWidth="1.5" />
        <rect className="sv-paper sv-p2" x="5"  y="5"  width="104" height="130" rx="6"
          fill="white" stroke="#C8C8C8" strokeWidth="1.5" />
        {/* front paper */}
        <rect className="sv-paper sv-p1" x="0"  y="0"  width="104" height="130" rx="6"
          fill="white" stroke="#000" strokeWidth="2" />
        {/* header accent */}
        <rect x="10" y="10" width="50" height="7" rx="2" fill="#E8E8E8" />
        {/* text lines */}
        <line x1="10" y1="28" x2="94" y2="28" stroke="#000"   strokeWidth="1.5" />
        <line x1="10" y1="42" x2="80" y2="42" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="10" y1="55" x2="86" y2="55" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="10" y1="68" x2="68" y2="68" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="10" y1="81" x2="78" y2="81" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="10" y1="94" x2="60" y2="94" stroke="#E0E0E0" strokeWidth="1.5" />
        <line x1="10" y1="107" x2="84" y2="107" stroke="#E0E0E0" strokeWidth="1.5" />
        {/* signature line */}
        <line x1="10" y1="118" x2="50" y2="118" stroke="#000" strokeWidth="1" />
        <text x="10" y="128" fontSize="7" fill="#888" fontFamily="monospace">SIGN ✓</text>
      </g>

      {/* ── Arrow 1: paper → cube ── */}
      <path
        className="sv-arrow1"
        d="M 138 272 C 155 258 168 240 172 225"
        stroke="#888" strokeWidth="1.5" strokeDasharray="5 3"
        markerEnd="url(#arr)"
      />

      {/* ── Isometric Cube (center, floating) ── */}
      <g className="sv-cube">
        {/* top face */}
        <polygon
          className="sv-face"
          points={pts([top, right, front, left])}
          fill="white" stroke="#000" strokeWidth="2"
          strokeDasharray="480"
        />
        {/* left face */}
        <polygon
          className="sv-face sv-face-l"
          points={pts([left, front, frontB, leftB])}
          fill="white" stroke="#000" strokeWidth="2"
          strokeDasharray="480"
        />
        {/* right face */}
        <polygon
          className="sv-face sv-face-r"
          points={pts([right, front, frontB, rightB])}
          fill="white" stroke="#000" strokeWidth="2"
          strokeDasharray="480"
        />
        {/* inner vertical edge (hidden line) */}
        <line x1={front[0]} y1={front[1]} x2={frontB[0]} y2={frontB[1]}
          stroke="#EAEAEA" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>

      {/* ── Arrow 2: cube → nodes ── */}
      <path
        className="sv-arrow2"
        d="M 248 128 C 258 112 266 96 270 85"
        stroke="#888" strokeWidth="1.5" strokeDasharray="5 3"
        markerEnd="url(#arr)"
      />

      {/* ── Node grid (top-right) ── */}
      <g transform="translate(266, 28)">
        {/* grid connector lines first (behind nodes) */}
        {([0,1,2,3] as number[]).flatMap(row =>
          ([0,1,2] as number[]).map(col => (
            <line key={`h${row}${col}`}
              className="sv-gl"
              x1={col*26} y1={row*26}
              x2={(col+1)*26} y2={row*26}
              stroke="#D8D8D8" strokeWidth="1"
              style={{ animationDelay: `${1700 + (row*3+col)*30}ms` }}
            />
          ))
        )}
        {([0,1,2] as number[]).flatMap(row =>
          ([0,1,2,3] as number[]).map(col => (
            <line key={`v${row}${col}`}
              className="sv-gl"
              x1={col*26} y1={row*26}
              x2={col*26} y2={(row+1)*26}
              stroke="#D8D8D8" strokeWidth="1"
              style={{ animationDelay: `${1700 + (row*4+col)*30}ms` }}
            />
          ))
        )}
        {/* nodes */}
        {([0,1,2,3] as number[]).flatMap(row =>
          ([0,1,2,3] as number[]).map(col => (
            <circle key={`n${row}${col}`}
              className="sv-node"
              cx={col*26} cy={row*26}
              r="2.5" fill="#000"
              style={{ animationDelay: `${1750 + (row*4+col)*55}ms` }}
            />
          ))
        )}
        {/* binary label */}
        <text x="39" y="108" fontSize="8" fill="#AAA" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
          01101
        </text>
        <text x="39" y="118" fontSize="8" fill="#AAA" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
          10010
        </text>
      </g>

      {/* ── Step labels ── */}
      <text x="74" y="238" fontSize="9" fill="#888" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">
        PAPER
      </text>
      <text x="200" y="300" fontSize="9" fill="#888" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">
        eBMR
      </text>
      <text x="305" y="152" fontSize="9" fill="#888" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">
        DIGITAL
      </text>
    </svg>
  )
}
