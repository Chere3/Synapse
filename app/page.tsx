import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Zap,
  Search,
  BarChart2,
  FileText,
  ShieldCheck,
  Plug,
  Clock,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import { AuthRedirect } from '@/components/auth-redirect'
import { HeroDemoMockup } from '@/components/hero-demo-mockup'

/* ─────────────────────────────────────────────
   SEO Metadata — Server Component
───────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Synapse — AI Contract Analysis for Legal Professionals',
  description:
    'Upload any contract and get instant AI-powered risk analysis, clause extraction, and plain-language summaries. Trusted by 2,400+ legal professionals. Start free.',
  keywords: [
    'contract analysis AI',
    'legal document review',
    'AI contract review',
    'contract risk scoring',
    'legal AI software',
    'NDA analysis tool',
    'contract clause extraction',
  ],
  openGraph: {
    title: 'Synapse — AI Contract Analysis for Legal Professionals',
    description:
      'Understand any contract in minutes. AI-powered risk scoring, clause extraction, and plain-language summaries trusted by 2,400+ legal professionals.',
    url: 'https://synapse.legal',
    siteName: 'Synapse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synapse — AI Contract Analysis',
    description:
      'Understand any contract in minutes. AI-powered risk scoring and clause extraction for legal professionals.',
    creator: '@synapse_legal',
  },
  alternates: {
    canonical: 'https://synapse.legal',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const features = [
  {
    Icon: Zap,
    title: 'Instant Analysis — Results in Seconds',
    body: 'Stop waiting days for manual review. Synapse reads your entire contract and surfaces every risk, obligation, and key term in under 30 seconds.',
    bg: 'bg-md-primary-container',
    accent: 'text-md-primary',
  },
  {
    Icon: Search,
    title: 'Clause-Level Intelligence You Can Trust',
    body: 'Pinpoint exactly which clause creates risk and why. Our AI explains every finding in plain language — no law degree required to understand it.',
    bg: 'bg-md-tertiary-container',
    accent: 'text-md-tertiary',
  },
  {
    Icon: BarChart2,
    title: 'Risk Scores That Drive Decisions',
    body: 'Each clause receives a colour-coded risk score and actionable recommendation. Know immediately what to negotiate, flag, or accept.',
    bg: 'bg-md-secondary-container',
    accent: 'text-md-secondary',
  },
  {
    Icon: FileText,
    title: 'Plain-Language Summaries',
    body: 'Get an executive summary in bullet points. Share it with clients or leadership without the legal jargon — build trust and save everyone\'s time.',
    bg: 'bg-md-tertiary-container',
    accent: 'text-md-tertiary',
  },
  {
    Icon: ShieldCheck,
    title: 'Enterprise-Grade Security',
    body: 'Your documents are encrypted in transit and at rest. We never train on your data and comply with GDPR, CCPA, and SOC 2 Type II requirements.',
    bg: 'bg-md-primary-container',
    accent: 'text-md-primary',
  },
  {
    Icon: Plug,
    title: 'Works With Your Workflow',
    body: 'Upload PDFs, Word docs, or paste raw text. Export annotated summaries to PDF or integrate via API into your existing document management system.',
    bg: 'bg-md-secondary-container',
    accent: 'text-md-secondary',
  },
]

const testimonials = [
  {
    quote:
      'Synapse cut our contract review time from 3 hours to 20 minutes. I don\'t know how we managed without it.',
    name: 'Sarah Chen',
    role: 'General Counsel',
    company: 'TechScale Inc.',
    initials: 'SC',
  },
  {
    quote:
      'The risk scoring is remarkably accurate. It caught an indemnification clause my team had missed. That alone paid for a year of the service.',
    name: 'Marcus Webb',
    role: 'Partner',
    company: 'Webb & Associates LLP',
    initials: 'MW',
  },
  {
    quote:
      'Finally, a legal AI tool that explains its reasoning. My clients love the plain-language summaries — it builds immediate trust.',
    name: 'Priya Nair',
    role: 'In-House Counsel',
    company: 'Meridian Group',
    initials: 'PN',
  },
]

const faqs = [
  {
    q: 'What types of contracts can Synapse analyse?',
    a: 'Synapse handles any standard legal document — NDAs, service agreements, employment contracts, vendor agreements, lease contracts, SaaS terms, and more. If it\'s a contract, our AI can read and analyse it.',
  },
  {
    q: 'How accurate is the AI risk scoring?',
    a: 'Our models are trained on millions of legal documents and validated by practising attorneys. The risk scoring has a 94% agreement rate with expert legal review in independent benchmarks.',
  },
  {
    q: 'Is my data secure and confidential?',
    a: 'Absolutely. All documents are encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your documents to train our models. You can request permanent deletion at any time.',
  },
  {
    q: 'Can my whole team use Synapse?',
    a: 'Yes. Team plans include shared workspaces, role-based access control, and audit logs. You can invite unlimited viewers and manage editor seats to fit your organisation.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes — you can analyse up to 3 contracts per month at no cost. Paid plans unlock unlimited analysis, priority processing, API access, and team collaboration features.',
  },
]

/* ─────────────────────────────────────────────
   Page Component (Server)
───────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* Redirect authenticated users — client-only logic isolated */}
      <AuthRedirect />

      {/* ── Top App Bar ── */}
      <header className="sticky top-0 z-50 border-b border-md-outline-variant bg-md-surface-1/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            aria-label="Synapse home"
            className="text-title-lg font-bold text-md-primary"
            style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
          >
            Synapse
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-label-lg text-md-on-surface-variant md:flex">
            <Link href="#how-it-works" className="hover:text-md-on-surface transition-colors duration-short4">
              How it works
            </Link>
            <Link href="#features" className="hover:text-md-on-surface transition-colors duration-short4">
              Features
            </Link>
            <Link href="#faq" className="hover:text-md-on-surface transition-colors duration-short4">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth" className="md-btn-text hidden sm:inline-flex">
              Sign In
            </Link>
            <Link href="/auth" className="md-btn-filled">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pb-16 pt-20"
        >
          {/* Atmospheric backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 90% 60% at 60% -5%, color-mix(in srgb, var(--md-sys-color-primary-container) 65%, transparent) 0%, transparent 60%)',
                'radial-gradient(ellipse 50% 40% at 10% 100%, color-mix(in srgb, var(--md-sys-color-tertiary-container) 35%, transparent) 0%, transparent 70%)',
                'radial-gradient(ellipse 40% 30% at 90% 90%, color-mix(in srgb, var(--md-sys-color-secondary-container) 25%, transparent) 0%, transparent 70%)',
              ].join(', '),
            }}
          />
          {/* Subtle dot-grid texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--md-sys-color-on-background) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative mx-auto max-w-7xl px-6">

            {/* ── Top: stacked headline (full-width) ── */}
            <div className="mb-12 text-center">
              {/* Eyebrow pill */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-md-full border border-md-outline-variant bg-md-surface/80 px-4 py-1.5 text-label-md text-md-on-surface-variant shadow-md-1 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-md-tertiary" aria-hidden="true" />
                <span>Trusted by <strong className="text-md-on-surface">2,400+</strong> legal professionals — SOC 2 Type II certified</span>
              </div>

              <h1
                id="hero-heading"
                className="mx-auto mb-5 max-w-4xl text-display-sm leading-[1.12] tracking-tight text-md-on-background lg:text-display-md"
                style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
              >
                Review contracts in{' '}
                <em className="not-italic text-md-primary">30 seconds.</em>
                <br className="hidden sm:block" />
                Miss nothing. Sign with confidence.
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-body-lg text-md-on-surface-variant">
                Synapse reads your entire contract — flagging every risk clause, extracting key terms,
                and delivering a plain-language summary your whole team can act on.
                No legal jargon. No waiting. No nasty surprises.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth"
                  className="md-btn-filled px-8 py-3 text-label-lg shadow-md-2"
                >
                  Start Analysing Free →
                </Link>
                <Link
                  href="#how-it-works"
                  className="md-btn-outlined px-8 py-3 text-label-lg"
                >
                  See How It Works
                </Link>
              </div>

              {/* Microcopy trust row */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-label-sm text-md-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  No credit card required
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  3 free analyses per month, forever
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  94% accuracy vs expert review
                </span>
              </div>
            </div>

            {/* ── Full-width product mockup ── */}
            <div className="mx-auto max-w-5xl">
              {/* Subtle glow behind the mockup */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
                style={{ background: 'var(--md-sys-color-primary-container)' }}
              />
              <HeroDemoMockup />
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════
            SOCIAL PROOF BAR
        ════════════════════════════════════════ */}
        <section
          aria-label="Companies that trust Synapse"
          className="border-y border-md-outline-variant bg-md-surface-1 py-8"
        >
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="mb-6 text-label-md uppercase tracking-widest text-md-on-surface-variant">
              Trusted by legal teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {['Meridian Group', 'TechScale Inc.', 'Webb & Associates', 'Axon Legal', 'Northfield Capital'].map(
                (name) => (
                  <span
                    key={name}
                    className="text-title-md font-semibold text-md-on-surface-variant opacity-60"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            PROBLEM / SOLUTION
        ════════════════════════════════════════ */}
        <section
          id="how-it-works"
          aria-labelledby="problem-heading"
          className="py-28"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">

              {/* Problem */}
              <div>
                <p className="mb-4 text-label-lg font-semibold uppercase tracking-widest text-md-on-surface-variant">
                  The Problem
                </p>
                <h2
                  id="problem-heading"
                  className="mb-6 text-headline-md text-md-on-background"
                  style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                >
                  Contract review is broken — and it&apos;s costing you.
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      Icon: Clock,
                      title: 'Hours lost per document',
                      body: 'Manual review of a 10-page contract takes 2–4 hours. Multiply that by your monthly volume and you\'re losing weeks of billable time.',
                    },
                    {
                      Icon: AlertTriangle,
                      title: 'High-stakes mistakes slip through',
                      body: 'Buried indemnification clauses, auto-renewal traps, and one-sided liability caps get missed when reviewers are rushed or under-resourced.',
                    },
                    {
                      Icon: Inbox,
                      title: 'Bottlenecks kill deals',
                      body: 'Deals stall when legal can\'t keep pace with business. Every day of delay is a negotiating advantage handed to the other side.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md-md bg-md-error-container text-md-error"
                        aria-hidden="true"
                      >
                        <item.Icon size={18} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-title-md font-semibold text-md-on-surface">{item.title}</h3>
                        <p className="mt-1 text-body-md text-md-on-surface-variant">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution */}
              <div>
                <p className="mb-4 text-label-lg font-semibold uppercase tracking-widest text-md-tertiary">
                  The Solution
                </p>
                <h2
                  className="mb-6 text-headline-md text-md-on-background"
                  style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                >
                  Synapse gives you legal clarity — instantly.
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      step: '01',
                      title: 'Upload your contract',
                      body: 'Drag and drop a PDF or Word doc. Paste text directly. We accept any format legal teams actually use.',
                    },
                    {
                      step: '02',
                      title: 'AI analyses every clause',
                      body: 'Our model reads the full document, identifies clause types, assigns risk levels, and flags anything that needs your attention.',
                    },
                    {
                      step: '03',
                      title: 'Act on clear, confident insights',
                      body: 'Get a risk summary, key terms table, and clause-by-clause breakdown in under 30 seconds. Export or share with one click.',
                    },
                  ].map((step) => (
                    <div key={step.step} className="flex gap-4">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md-full bg-md-primary text-label-md font-bold text-md-on-primary"
                        aria-hidden="true"
                      >
                        {step.step}
                      </span>
                      <div>
                        <h3 className="text-title-md font-semibold text-md-on-surface">{step.title}</h3>
                        <p className="mt-1 text-body-md text-md-on-surface-variant">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link href="/auth" className="md-btn-filled px-8 py-3 text-label-lg">
                    Try It Free — No Card Required
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════════ */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="py-28"
          style={{ background: 'var(--md-sys-color-surface-1)' }}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-label-lg font-semibold uppercase tracking-widest text-md-primary">
                Features
              </p>
              <h2
                id="features-heading"
                className="text-headline-lg text-md-on-background"
                style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
              >
                Everything legal teams need to move faster
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-body-lg text-md-on-surface-variant">
                Synapse is built for legal professionals who can&apos;t afford mistakes —
                and can&apos;t afford to be slow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="md-card-elevated group p-8 transition-shadow duration-medium2 hover:shadow-md-3"
                >
                  <div
                    className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-md-lg ${f.bg} ${f.accent}`}
                    aria-hidden="true"
                  >
                    <f.Icon size={24} strokeWidth={1.75} />
                  </div>
                  <h3
                    className="mb-3 text-title-lg text-md-on-surface"
                    style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-body-md text-md-on-surface-variant">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════════════ */}
        <section
          aria-labelledby="testimonials-heading"
          className="py-28"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-label-lg font-semibold uppercase tracking-widest text-md-on-surface-variant">
                What our customers say
              </p>
              <h2
                id="testimonials-heading"
                className="text-headline-lg text-md-on-background"
                style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
              >
                Trusted by legal professionals who&apos;ve seen the difference
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="md-card-elevated flex flex-col gap-6 p-8"
                >
                  {/* Stars */}
                  <div className="flex gap-1" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-md-primary" aria-hidden="true">★</span>
                    ))}
                  </div>

                  <blockquote className="flex-1 text-body-lg italic text-md-on-surface">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <figcaption className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-md-full bg-md-primary-container text-label-lg font-bold text-md-on-primary-container"
                      aria-hidden="true"
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-title-sm font-semibold text-md-on-surface">{t.name}</p>
                      <p className="text-body-sm text-md-on-surface-variant">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            METRICS / TRUST STRIP
        ════════════════════════════════════════ */}
        <section
          aria-label="Key metrics"
          className="py-20"
          style={{ background: 'var(--md-sys-color-primary-container)' }}
        >
          <div className="mx-auto max-w-5xl px-6">
            <dl className="grid grid-cols-2 gap-10 lg:grid-cols-4">
              {[
                { value: '2,400+', label: 'Legal professionals' },
                { value: '< 30s', label: 'Average analysis time' },
                { value: '94%', label: 'Accuracy vs expert review' },
                { value: '3 hrs', label: 'Saved per contract' },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <dt
                    className="text-display-sm font-bold text-md-primary"
                    style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
                  >
                    {m.value}
                  </dt>
                  <dd className="mt-1 text-body-md text-md-on-primary-container">
                    {m.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ════════════════════════════════════════
            MID-PAGE CTA
        ════════════════════════════════════════ */}
        <section
          aria-labelledby="mid-cta-heading"
          className="py-24"
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2
              id="mid-cta-heading"
              className="mb-4 text-headline-md text-md-on-background"
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              Your next contract review shouldn&apos;t take hours.
            </h2>
            <p className="mb-8 text-body-lg text-md-on-surface-variant">
              Start analysing documents for free — no credit card, no setup, no waiting.
              Upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/auth" className="md-btn-filled px-10 py-3 text-label-lg">
                Get Started Free
              </Link>
              <Link href="#faq" className="md-btn-outlined px-10 py-3 text-label-lg">
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FAQ
        ════════════════════════════════════════ */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-28"
          style={{ background: 'var(--md-sys-color-surface-1)' }}
        >
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-label-lg font-semibold uppercase tracking-widest text-md-on-surface-variant">
                FAQ
              </p>
              <h2
                id="faq-heading"
                className="text-headline-lg text-md-on-background"
                style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
              >
                Frequently asked questions
              </h2>
            </div>

            <dl className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="md-card-elevated overflow-hidden rounded-md-lg"
                >
                  <dt className="px-8 pt-6 text-title-md font-semibold text-md-on-surface">
                    {faq.q}
                  </dt>
                  <dd className="px-8 pb-6 pt-2 text-body-md text-md-on-surface-variant">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════ */}
        <section
          aria-labelledby="final-cta-heading"
          className="py-28"
          style={{
            background: [
              'radial-gradient(ellipse 80% 80% at 50% 120%, color-mix(in srgb, var(--md-sys-color-primary-container) 60%, transparent) 0%, transparent 70%)',
              'var(--md-sys-color-background)',
            ].join(', '),
          }}
        >
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2
              id="final-cta-heading"
              className="mb-5 text-headline-lg text-md-on-background"
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              Ready to review contracts like never before?
            </h2>
            <p className="mb-8 text-body-lg text-md-on-surface-variant">
              Join 2,400+ legal professionals who&apos;ve made Synapse part of their workflow.
              Start free. No credit card required.
            </p>
            <Link
              href="/auth"
              className="md-btn-filled px-12 py-4 text-label-lg"
            >
              Start Analysing Contracts Free →
            </Link>
            <p className="mt-4 text-body-sm text-md-on-surface-variant">
              3 free analyses per month, forever. Upgrade anytime.
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          background: 'var(--md-sys-color-inverse-surface)',
          color: 'var(--md-sys-color-inverse-on-surface)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <span
                className="text-title-lg font-bold"
                style={{
                  color: 'var(--md-sys-color-inverse-primary)',
                  fontFamily: 'var(--font-domine, Domine, serif)',
                }}
              >
                Synapse
              </span>
              <p className="mt-3 text-body-md opacity-70">
                AI-powered legal document analysis — built for speed, accuracy, and trust.
              </p>
              <p className="mt-4 text-label-md opacity-50">SOC 2 Type II · GDPR · CCPA</p>
            </div>

            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Pricing', href: '#' },
                  { label: 'Security', href: '#' },
                ],
              },
              {
                heading: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Careers', href: '#' },
                  { label: 'Contact', href: '#' },
                  { label: 'Blog', href: '#' },
                ],
              },
              {
                heading: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                  { label: 'Cookie Policy', href: '#' },
                  { label: 'Data Processing', href: '#' },
                ],
              },
            ].map((col) => (
              <nav key={col.heading} aria-label={`${col.heading} links`}>
                <h3 className="mb-4 text-label-lg font-semibold uppercase tracking-widest opacity-50">
                  {col.heading}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-body-md opacity-70 transition-opacity duration-short4 hover:opacity-100"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <hr className="mb-8 mt-12 opacity-10" />

          <div className="flex flex-col items-center justify-between gap-4 text-body-sm opacity-50 sm:flex-row">
            <p>© {new Date().getFullYear()} Synapse Legal Technologies, Inc. All rights reserved.</p>
            <p>Made for legal professionals who move fast.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
