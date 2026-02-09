import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Archive, Check, Lightbulb, Scale, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface ChatMessageActionsProps {
  messageId: string;
  content: string;
  modelName: string | null;
  sessionId: string;
  isAiMessage: boolean;
  onDelete: (messageId: string) => void;
  onSaveToMemory?: (messageId: string, content: string) => Promise<void>;
  isSavingToMemory?: boolean;
  isAlreadySavedToMemory?: boolean;
  onConsultInDChat?: (messageId: string, content: string) => void;
  onRequestEvaluation?: (messageId: string, content: string, modelName: string | null) => void;
  onHallucination?: (messageId: string, modelName: string | null, sessionId: string) => void;
}

export function ChatMessageActions({
  messageId, content, modelName, sessionId, isAiMessage, onDelete,
  onSaveToMemory, isSavingToMemory, isAlreadySavedToMemory,
  onConsultInDChat, onRequestEvaluation, onHallucination,
}: ChatMessageActionsProps) {
  const { t } = useLanguage();
  const [savedToMemory, setSavedToMemory] = useState(isAlreadySavedToMemory || false);

  const handleSaveToMemory = useCallback(async () => {
    if (isAlreadySavedToMemory || savedToMemory || isSavingToMemory || !onSaveToMemory) return;
    try {
      await onSaveToMemory(messageId, content);
      setSavedToMemory(true);
    } catch { /* handled by hook */ }
  }, [onSaveToMemory, messageId, content, savedToMemory, isSavingToMemory, isAlreadySavedToMemory]);

  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {isAiMessage && onRequestEvaluation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-hydra-arbiter hover:text-hydra-arbiter hover:bg-hydra-arbiter/10"
                onClick={() => onRequestEvaluation(messageId, content, modelName)}>
                <Scale className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">{t('dchat.requestEvaluation')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isAiMessage && onHallucination && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                onClick={() => onHallucination(messageId, modelName, sessionId)}>
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">{t('dchat.flagHallucination')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isAiMessage && onConsultInDChat && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-hydra-consultant hover:text-hydra-consultant hover:bg-hydra-consultant/10"
                onClick={() => onConsultInDChat(messageId, content)}>
                <Lightbulb className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">{t('dchat.consultOnMessage')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isAiMessage && onSaveToMemory && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                  (isAlreadySavedToMemory || savedToMemory)
                    ? "bg-hydra-success/20 text-hydra-success cursor-default"
                    : "hover:bg-hydra-archivist/10 text-hydra-archivist hover:text-hydra-archivist"
                )}
                onClick={handleSaveToMemory}
                disabled={isSavingToMemory || savedToMemory || isAlreadySavedToMemory}
                whileTap={!(savedToMemory || isAlreadySavedToMemory) && !isSavingToMemory ? { scale: 0.9 } : undefined}
              >
                <AnimatePresence mode="wait">
                  {(isAlreadySavedToMemory || savedToMemory) ? (
                    <motion.span key="saved" initial={isAlreadySavedToMemory ? { scale: 1 } : { scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                      <Check className="h-4 w-4" />
                    </motion.span>
                  ) : isSavingToMemory ? (
                    <motion.span key="saving" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Loader2 className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span key="idle" whileHover={{ scale: 1.1 }}>
                      <Archive className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                {(isAlreadySavedToMemory || savedToMemory) ? t('messages.savedToMemory') : t('messages.saveToMemory')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Expand/collapse handled externally */}

      <AlertDialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">{t('common.delete')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('messages.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('messages.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(messageId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
