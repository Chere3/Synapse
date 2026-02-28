import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ── M3 Color tokens (maps CSS vars) ── */
      colors: {
        md: {
          primary:             'var(--md-sys-color-primary)',
          'on-primary':        'var(--md-sys-color-on-primary)',
          'primary-container': 'var(--md-sys-color-primary-container)',
          'on-primary-container': 'var(--md-sys-color-on-primary-container)',
          secondary:           'var(--md-sys-color-secondary)',
          'on-secondary':      'var(--md-sys-color-on-secondary)',
          'secondary-container': 'var(--md-sys-color-secondary-container)',
          'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
          tertiary:            'var(--md-sys-color-tertiary)',
          'on-tertiary':       'var(--md-sys-color-on-tertiary)',
          'tertiary-container':'var(--md-sys-color-tertiary-container)',
          'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
          error:               'var(--md-sys-color-error)',
          'on-error':          'var(--md-sys-color-on-error)',
          'error-container':   'var(--md-sys-color-error-container)',
          'on-error-container':'var(--md-sys-color-on-error-container)',
          background:          'var(--md-sys-color-background)',
          'on-background':     'var(--md-sys-color-on-background)',
          surface:             'var(--md-sys-color-surface)',
          'on-surface':        'var(--md-sys-color-on-surface)',
          'surface-variant':   'var(--md-sys-color-surface-variant)',
          'on-surface-variant':'var(--md-sys-color-on-surface-variant)',
          'surface-1':         'var(--md-sys-color-surface-1)',
          'surface-2':         'var(--md-sys-color-surface-2)',
          'surface-3':         'var(--md-sys-color-surface-3)',
          outline:             'var(--md-sys-color-outline)',
          'outline-variant':   'var(--md-sys-color-outline-variant)',
          'inverse-surface':   'var(--md-sys-color-inverse-surface)',
          'inverse-on-surface':'var(--md-sys-color-inverse-on-surface)',
          'inverse-primary':   'var(--md-sys-color-inverse-primary)',
        },
      },

      /* ── M3 Border radius ── */
      borderRadius: {
        'md-xs':  'var(--md-sys-shape-extra-small)',
        'md-sm':  'var(--md-sys-shape-small)',
        'md-md':  'var(--md-sys-shape-medium)',
        'md-lg':  'var(--md-sys-shape-large)',
        'md-xl':  'var(--md-sys-shape-extra-large)',
        'md-full':'var(--md-sys-shape-full)',
      },

      /* ── M3 Box shadows (elevation) ── */
      boxShadow: {
        'md-1': 'var(--md-sys-elevation-1)',
        'md-2': 'var(--md-sys-elevation-2)',
        'md-3': 'var(--md-sys-elevation-3)',
        'md-4': 'var(--md-sys-elevation-4)',
        'md-5': 'var(--md-sys-elevation-5)',
      },

      /* ── Typography ── */
      fontFamily: {
        display: ['Domine', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg':   ['57px', { lineHeight: '64px', fontWeight: '400' }],
        'display-md':   ['45px', { lineHeight: '52px', fontWeight: '400' }],
        'display-sm':   ['36px', { lineHeight: '44px', fontWeight: '400' }],
        'headline-lg':  ['32px', { lineHeight: '40px', fontWeight: '400' }],
        'headline-md':  ['28px', { lineHeight: '36px', fontWeight: '400' }],
        'headline-sm':  ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'title-lg':     ['22px', { lineHeight: '28px', fontWeight: '400' }],
        'title-md':     ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'title-sm':     ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-lg':      ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':      ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm':      ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg':     ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md':     ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-sm':     ['11px', { lineHeight: '16px', fontWeight: '500' }],
      },

      /* ── Motion duration ── */
      transitionDuration: {
        'short1':  '50ms',
        'short2':  '100ms',
        'short3':  '150ms',
        'short4':  '200ms',
        'medium1': '250ms',
        'medium2': '300ms',
        'medium3': '350ms',
        'medium4': '400ms',
        'long1':   '450ms',
        'long2':   '500ms',
      },

      /* ── Motion easing ── */
      transitionTimingFunction: {
        'md-standard':       'cubic-bezier(0.2, 0, 0, 1)',
        'md-standard-decel': 'cubic-bezier(0, 0, 0, 1)',
        'md-standard-accel': 'cubic-bezier(0.3, 0, 1, 1)',
        'md-emphasized':     'cubic-bezier(0.2, 0, 0, 1)',
        'md-emph-decel':     'cubic-bezier(0.05, 0.7, 0.1, 1)',
      },

      /* ── Background images ── */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      /* ── Keyframes ── */
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%':      { transform: 'translateY(-16px)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float:       'float 6s ease-in-out infinite',
        'fade-in-up':'fadeInUp 0.5s cubic-bezier(0.05, 0.7, 0.1, 1) both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
