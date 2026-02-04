import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FieldErrorProps {
  error: string | null;
  className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
  const { t } = useLanguage();
  
  if (!error) return null;
  
  return (
    <p className={`text-xs text-destructive flex items-center gap-1 mt-1 ${className}`}>
      <AlertCircle className="h-3 w-3" />
      {t(`flowEditor.validation.${error}`)}
    </p>
  );
}
