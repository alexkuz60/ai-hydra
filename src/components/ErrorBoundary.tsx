import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Standalone translations for ErrorBoundary (since it can't use hooks)
const errorTranslations = {
  'error.title': { ru: 'Что-то пошло не так', en: 'Something went wrong' },
  'error.description': { 
    ru: 'Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.', 
    en: 'An unexpected error occurred. Please try reloading the page.' 
  },
  'error.technicalInfo': { ru: 'Техническая информация', en: 'Technical details' },
  'error.tryAgain': { ru: 'Попробовать снова', en: 'Try again' },
  'error.reload': { ru: 'Перезагрузить', en: 'Reload' },
};

type Language = 'ru' | 'en';

function getLanguage(): Language {
  const saved = localStorage.getItem('hydra-language');
  return saved === 'en' ? 'en' : 'ru';
}

function t(key: keyof typeof errorTranslations): string {
  const lang = getLanguage();
  return errorTranslations[key]?.[lang] || key;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {t('error.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('error.description')}
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t('error.technicalInfo')}
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-destructive whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                {t('error.tryAgain')}
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('error.reload')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
