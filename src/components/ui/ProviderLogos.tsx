import React from 'react';

export function LovableLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="lovable-heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(280, 80%, 60%)" />
          <stop offset="40%" stopColor="hsl(350, 90%, 60%)" />
          <stop offset="100%" stopColor="hsl(30, 100%, 55%)" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#lovable-heart-grad)"
      />
    </svg>
  );
}

export function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export function AnthropicLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.304 3.541h-3.48l6.175 16.918H23.5zm-10.608 0L.5 20.459h3.572l1.272-3.48h6.534l1.272 3.48h3.572L10.547 3.541zm-.524 10.462l2.244-6.144 2.244 6.144z" />
    </svg>
  );
}

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function XAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.8 4l7.2 10.8L2.4 20h1.6l6.4-4.4L16.8 20H22l-7.6-11.2L21.2 4h-1.6L13.6 8.2 7.2 4H2.8zm2.4 1.2h2.4l11.2 13.6h-2.4L5.2 5.2z" />
    </svg>
  );
}

export function OpenRouterLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  );
}

export function GroqLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 0 1 7 7h-3a4 4 0 0 0-4-4V5zm0 14a7 7 0 0 1-7-7h3a4 4 0 0 0 4 4v3z" />
    </svg>
  );
}

export function DeepSeekLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FirecrawlLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-1.5 4-5 6-5 10a5 5 0 0 0 10 0c0-4-3.5-6-5-10zm0 15a2.5 2.5 0 0 1-2.5-2.5c0-1.5 1.5-3 2.5-4.5 1 1.5 2.5 3 2.5 4.5A2.5 2.5 0 0 1 12 17z" />
    </svg>
  );
}

export function TavilyLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

export function PerplexityLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L4 6v6l8 4 8-4V6l-8-4zm0 2.18L18 7.5v4.32l-6 3-6-3V7.5L12 4.18zM12 16l-6-3v2l6 3 6-3v-2l-6 3z" />
    </svg>
  );
}

export function MistralLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="4" height="4" />
      <rect x="10" y="2" width="4" height="4" />
      <rect x="18" y="2" width="4" height="4" />
      <rect x="2" y="7" width="4" height="4" />
      <rect x="6" y="7" width="4" height="4" />
      <rect x="10" y="7" width="4" height="4" />
      <rect x="18" y="7" width="4" height="4" />
      <rect x="2" y="12" width="4" height="4" />
      <rect x="10" y="12" width="4" height="4" />
      <rect x="14" y="12" width="4" height="4" />
      <rect x="18" y="12" width="4" height="4" />
      <rect x="2" y="17" width="4" height="4" />
      <rect x="10" y="17" width="4" height="4" />
      <rect x="18" y="17" width="4" height="4" />
    </svg>
  );
}

export const PROVIDER_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
  lovable: LovableLogo,
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  gemini: GoogleLogo,
  xai: XAILogo,
  openrouter: OpenRouterLogo,
  groq: GroqLogo,
  deepseek: DeepSeekLogo,
  firecrawl: FirecrawlLogo,
  tavily: TavilyLogo,
  perplexity: PerplexityLogo,
  mistral: MistralLogo,
};

export const PROVIDER_COLORS: Record<string, string> = {
  lovable: 'text-hydra-cyan',
  openai: 'text-green-400',
  anthropic: 'text-hydra-amber',
  gemini: 'text-blue-400',
  xai: 'text-red-400',
  openrouter: 'text-hydra-purple',
  groq: 'text-orange-400',
  deepseek: 'text-teal-400',
  firecrawl: 'text-orange-500',
  tavily: 'text-emerald-400',
  perplexity: 'text-sky-400',
  mistral: 'text-amber-500',
};
