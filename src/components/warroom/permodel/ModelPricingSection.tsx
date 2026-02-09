import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { getModelPricing, formatPrice, estimateTokens, calculateRequestCost, type SingleModelSettings } from './types';

interface ModelPricingSectionProps {
  modelId: string;
  modelSettings: SingleModelSettings;
  currentMessage: string;
}

export function ModelPricingSection({ modelId, modelSettings, currentMessage }: ModelPricingSectionProps) {
  const { t } = useLanguage();
  const pricing = getModelPricing(modelId);
  const inputTokens = estimateTokens(currentMessage + modelSettings.systemPrompt);
  const costEstimate = pricing ? calculateRequestCost(pricing, inputTokens, modelSettings.maxTokens) : null;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        {t('settings.pricing')}
      </Label>
      {pricing ? (
        <div className="bg-muted/50 rounded-md p-2 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('settings.inputCost')}:</span>
            <span className="font-mono text-muted-foreground">{formatPrice(pricing.input)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('settings.outputCost')}:</span>
            <span className="font-mono text-muted-foreground">{formatPrice(pricing.output)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground text-center border-b border-border pb-2">{t('settings.perMillion')}</div>
          <div className="pt-1">
            <div className="text-[10px] text-muted-foreground mb-1">{t('settings.estimatedCost')}:</div>
            {inputTokens > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('settings.inputTokens')}:</span>
                  <span className="font-mono">~{inputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('settings.outputTokens')}:</span>
                  <span className="font-mono">≤{modelSettings.maxTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-border font-medium">
                  <span>{t('settings.totalCost')}:</span>
                  <span className="font-mono text-primary">≤{formatPrice(costEstimate!.totalCost)}</span>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-muted-foreground italic">{t('settings.enterMessage')}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground text-center">{t('settings.noPricing')}</div>
      )}
    </div>
  );
}
