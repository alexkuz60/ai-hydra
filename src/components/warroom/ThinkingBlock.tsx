import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, ChevronDown, Languages, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThinkingBlockProps {
  reasoning: string;
  messageId: string;
  savedTranslation?: string | null;
  onTranslationSaved?: (translation: string) => void;
}

export function ThinkingBlock({ 
  reasoning, 
  messageId, 
  savedTranslation,
  onTranslationSaved 
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(savedTranslation || null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  // Update local state if savedTranslation prop changes
  useEffect(() => {
    if (savedTranslation) {
      setTranslatedText(savedTranslation);
    }
  }, [savedTranslation]);

  const displayText = translatedText || reasoning;

  const handleTranslate = async () => {
    if (isTranslating) return;
    
    // If already have translation, toggle to original
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    
    // If saved translation exists, load it
    if (savedTranslation) {
      setTranslatedText(savedTranslation);
      return;
    }
    
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: reasoning, targetLang: 'Russian' }
      });

      if (error) throw error;
      
      console.log("Translation response:", data);
      
      if (data?.translation) {
        setTranslatedText(data.translation);
        
        // Save translation to database
        const { error: updateError } = await supabase
          .from('messages')
          .update({ reasoning_translated: data.translation })
          .eq('id', messageId);
        
        if (updateError) {
          console.error('Failed to save translation:', updateError);
        } else {
          onTranslationSaved?.(data.translation);
        }
      } else {
        console.warn("Empty translation received:", data);
        toast({
          title: t('common.error'),
          description: t('thinking.translateEmpty'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: t('common.error'),
        description: t('thinking.translateError'),
        variant: 'destructive'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const getButtonLabel = () => {
    if (isTranslating) return t('thinking.translating');
    if (translatedText) return t('thinking.showOriginal');
    if (savedTranslation) return t('thinking.showTranslated');
    return t('thinking.translate');
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="mb-3 border border-border/30 rounded-lg bg-muted/20">
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 px-3 hover:bg-muted/30 transition-colors rounded-lg">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            {t('thinking.title')}
          </span>
          {translatedText && (
            <span className="text-[10px] text-amber-500/70 ml-1">
              ({t('thinking.translated')})
            </span>
          )}
          {savedTranslation && !translatedText && (
            <span className="text-[10px] text-primary/70 ml-1" title={t('thinking.hasSaved')}>
              <Check className="h-3 w-3 inline" />
            </span>
          )}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 ml-auto transition-transform text-muted-foreground",
            isExpanded && "rotate-180"
          )} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3">
            <pre className="text-[11px] text-muted-foreground/70 font-mono whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {displayText}
            </pre>
            
            {language === 'ru' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                {isTranslating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Languages className="h-3 w-3 mr-1" />
                )}
                {getButtonLabel()}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}