import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol',
  				'Noto Color Emoji'
  			],
  			mono: [
  				'JetBrains Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			],
  			rounded: [
  				'Quicksand',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			hydra: {
  				glow: 'hsl(var(--hydra-glow))',
  				'glow-muted': 'hsl(var(--hydra-glow-muted))',
  				critical: 'hsl(var(--hydra-critical))',
  				success: 'hsl(var(--hydra-success))',
  				warning: 'hsl(var(--hydra-warning))',
  				expert: 'hsl(var(--hydra-expert))',
  				arbiter: 'hsl(var(--hydra-arbiter))',
  				consultant: 'hsl(var(--hydra-consultant))',
  				supervisor: 'hsl(var(--hydra-supervisor))',
  				moderator: 'hsl(var(--hydra-moderator))',
  				user: 'hsl(var(--hydra-user))',
  				admin: 'hsl(var(--hydra-admin))',
  				advisor: 'hsl(var(--hydra-advisor))',
  				archivist: 'hsl(var(--hydra-archivist))',
  				analyst: 'hsl(var(--hydra-analyst))',
  				webhunter: 'hsl(var(--hydra-webhunter))',
  				promptengineer: 'hsl(var(--hydra-promptengineer))',
  				flowregulator: 'hsl(var(--hydra-flowregulator))',
  				toolsmith: 'hsl(var(--hydra-toolsmith))',
  				guide: 'hsl(var(--hydra-guide))',
  				memory: 'hsl(var(--hydra-memory))',
  				cyan: 'hsl(var(--hydra-cyan))',
  				info: 'hsl(var(--hydra-info))',
  				surface: 'hsl(var(--hydra-surface))',
  				'surface-elevated': 'hsl(var(--hydra-surface-elevated))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			'slide-up': {
  				from: {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': {
  					opacity: '0.6'
  				},
  				'50%': {
  					opacity: '1'
  				}
  			},
  			'glow-pulse-bar': {
  				'0%, 100%': {
  					boxShadow: '0 0 5px hsl(var(--hydra-glow))',
  					opacity: '0.8'
  				},
  				'50%': {
  					boxShadow: '0 0 12px hsl(var(--hydra-glow))',
  					opacity: '1'
  				}
  			},
  			'spin-slow': {
  				'0%': {
  					transform: 'rotate(0deg)'
  				},
  				'100%': {
  					transform: 'rotate(360deg)'
  				}
  			},
  			'pipeline-flow': {
  				'0%': {
  					backgroundPosition: '0% 0%'
  				},
  				'100%': {
  					backgroundPosition: '0% 100%'
  				}
  			},
  			'arrow-flow': {
  				'0%': {
  					top: '-12px',
  					opacity: '0'
  				},
  				'20%': {
  					opacity: '1'
  				},
  				'80%': {
  					opacity: '1'
  				},
  				'100%': {
  					top: 'calc(100% - 4px)',
  					opacity: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'pipeline-flow': 'pipeline-flow 1.5s ease-in-out infinite',
  			'arrow-flow': 'arrow-flow 1.2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
