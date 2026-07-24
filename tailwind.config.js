import konstaConfig from 'konsta/config';

/** @type {import('tailwindcss').Config} */
export default konstaConfig({
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Scan các file trong thư mục src
    "./index.html",
    "./node_modules/@ionic/react/**/*.js"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'ds-none': 'var(--ds-radius-none)',
        'ds-sm': 'var(--ds-radius-sm)',
        'ds-md': 'var(--ds-radius-md)',
        'ds-lg': 'var(--ds-radius-lg)',
        'ds-xl': 'var(--ds-radius-xl)',
        'ds-full': 'var(--ds-radius-full)',
        'ds-control': 'var(--ds-radius-md)',
        'ds-card': 'var(--ds-radius-lg)',
        'ds-pill': 'var(--ds-radius-full)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'custom-primary': {
          DEFAULT: 'rgb(97,210,204)',
          foreground: 'hsl(var(--primary-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'ds-brand': {
          DEFAULT: 'var(--ds-color-brand-primary)',
          hover: 'var(--ds-color-brand-primary-hover)',
          pressed: 'var(--ds-color-brand-primary-pressed)',
          soft: 'var(--ds-color-brand-primary-soft)',
          focus: 'var(--ds-color-brand-focus)'
        },
        'ds-background-page': 'var(--ds-color-background-page)',
        'ds-action-primary': 'var(--ds-color-action-primary)',
        'ds-action-primary-pressed': 'var(--ds-color-action-primary-pressed)',
        'ds-action-neutral': 'var(--ds-color-action-neutral)',
        'ds-action-neutral-pressed': 'var(--ds-color-action-neutral-pressed)',
        'ds-focus': 'var(--ds-color-brand-focus)',
        'ds-surface-default': 'var(--ds-color-surface-default)',
        'ds-border-default': 'var(--ds-color-border-default)',
        'ds-status-info-subtle': 'var(--ds-color-status-info-soft)',
        'ds-status-success-subtle': 'var(--ds-color-status-success-soft)',
        'ds-status-warning-subtle': 'var(--ds-color-status-warning-soft)',
        'ds-status-danger-subtle': 'var(--ds-color-status-danger-soft)',
        'ds-status-danger-pressed': 'var(--ds-color-status-danger-pressed)',
        'ds-surface': {
          DEFAULT: 'var(--ds-color-surface-default)',
          subtle: 'var(--ds-color-surface-subtle)',
          disabled: 'var(--ds-color-surface-disabled)',
          overlay: 'var(--ds-color-surface-overlay)'
        },
        'ds-text': {
          primary: 'var(--ds-color-text-primary)',
          secondary: 'var(--ds-color-text-secondary)',
          disabled: 'var(--ds-color-text-disabled)',
          inverse: 'var(--ds-color-text-inverse)'
        },
        'ds-border': {
          DEFAULT: 'var(--ds-color-border-default)',
          muted: 'var(--ds-color-border-muted)',
          strong: 'var(--ds-color-border-strong)',
          focus: 'var(--ds-color-border-focus)'
        },
        'ds-status': {
          info: 'var(--ds-color-status-info)',
          'info-soft': 'var(--ds-color-status-info-soft)',
          success: 'var(--ds-color-status-success)',
          'success-soft': 'var(--ds-color-status-success-soft)',
          warning: 'var(--ds-color-status-warning)',
          'warning-soft': 'var(--ds-color-status-warning-soft)',
          danger: 'var(--ds-color-status-danger)',
          'danger-soft': 'var(--ds-color-status-danger-soft)',
          neutral: 'var(--ds-color-status-neutral)',
          'neutral-soft': 'var(--ds-color-status-neutral-soft)'
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      spacing: {
        'ds-0': 'var(--ds-space-0)',
        'ds-1': 'var(--ds-space-1)',
        'ds-2': 'var(--ds-space-2)',
        'ds-3': 'var(--ds-space-3)',
        'ds-4': 'var(--ds-space-4)',
        'ds-5': 'var(--ds-space-5)',
        'ds-6': 'var(--ds-space-6)',
        'ds-8': 'var(--ds-space-8)',
        'ds-10': 'var(--ds-space-10)',
        'ds-12': 'var(--ds-space-12)',
        'ds-page-x': 'var(--ds-layout-page-padding-inline)',
        'ds-page-y': 'var(--ds-layout-page-padding-block)',
        'ds-safe-top': 'var(--ds-safe-area-top)',
        'ds-safe-right': 'var(--ds-safe-area-right)',
        'ds-safe-bottom': 'var(--ds-safe-area-bottom)',
        'ds-safe-left': 'var(--ds-safe-area-left)'
      },
      fontFamily: {
        'ds-sans': ['var(--ds-font-family-sans)']
      },
      fontSize: {
        'ds-display': ['var(--ds-font-size-display)', {
          lineHeight: 'var(--ds-font-line-height-display)',
          fontWeight: 'var(--ds-font-weight-bold)'
        }],
        'ds-title': ['var(--ds-font-size-title)', {
          lineHeight: 'var(--ds-font-line-height-title)',
          fontWeight: 'var(--ds-font-weight-semibold)'
        }],
        'ds-heading': ['var(--ds-font-size-heading)', {
          lineHeight: 'var(--ds-font-line-height-heading)',
          fontWeight: 'var(--ds-font-weight-semibold)'
        }],
        'ds-body': ['var(--ds-font-size-body)', {
          lineHeight: 'var(--ds-font-line-height-body)',
          fontWeight: 'var(--ds-font-weight-regular)'
        }],
        'ds-label': ['var(--ds-font-size-label)', {
          lineHeight: 'var(--ds-font-line-height-label)',
          fontWeight: 'var(--ds-font-weight-medium)'
        }],
        'ds-caption': ['var(--ds-font-size-caption)', {
          lineHeight: 'var(--ds-font-line-height-caption)',
          fontWeight: 'var(--ds-font-weight-regular)'
        }],
        'ds-input': ['var(--ds-font-size-input)', {
          lineHeight: 'var(--ds-font-line-height-body)'
        }]
      },
      fontWeight: {
        'ds-regular': 'var(--ds-font-weight-regular)',
        'ds-medium': 'var(--ds-font-weight-medium)',
        'ds-semibold': 'var(--ds-font-weight-semibold)',
        'ds-bold': 'var(--ds-font-weight-bold)'
      },
      boxShadow: {
        'ds-none': 'var(--ds-shadow-none)',
        'ds-card': 'var(--ds-shadow-card)',
        'ds-raised': 'var(--ds-shadow-card)',
        'ds-overlay': 'var(--ds-shadow-overlay)'
      },
      borderWidth: {
        ds: 'var(--ds-border-width-thin)'
      },
      minHeight: {
        'ds-control': 'var(--ds-layout-control-min-size)'
      },
      minWidth: {
        'ds-control': 'var(--ds-layout-control-min-size)'
      },
      height: {
        'ds-control-md': 'var(--ds-layout-control-height-md)',
        'ds-control-lg': 'var(--ds-layout-control-height-lg)',
        'ds-icon-sm': 'var(--ds-layout-icon-size-sm)',
        'ds-icon-md': 'var(--ds-layout-icon-size-md)',
        'ds-icon-lg': 'var(--ds-layout-icon-size-lg)'
      },
      width: {
        'ds-icon-sm': 'var(--ds-layout-icon-size-sm)',
        'ds-icon-md': 'var(--ds-layout-icon-size-md)',
        'ds-icon-lg': 'var(--ds-layout-icon-size-lg)'
      },
      maxWidth: {
        'ds-content': 'var(--ds-layout-content-max-width)'
      },
      transitionDuration: {
        'ds-instant': 'var(--ds-motion-duration-instant)',
        'ds-fast': 'var(--ds-motion-duration-fast)',
        'ds-normal': 'var(--ds-motion-duration-normal)',
        'ds-slow': 'var(--ds-motion-duration-slow)'
      },
      transitionTimingFunction: {
        'ds-standard': 'var(--ds-motion-easing-standard)',
        'ds-emphasized': 'var(--ds-motion-easing-emphasized)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
});
