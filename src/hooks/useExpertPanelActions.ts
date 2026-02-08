import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModelStatistics } from '@/hooks/useModelStatistics';
import type { MessageRole } from '@/config/roles';

interface Message {
  id: string;
  role: string;
  content: string;
  model_name: string | null;
  metadata?: unknown;
}

interface UseExpertPanelActionsOptions {
  userId: string | null | undefined;
  sessionId: string | null;
  messages: Message[];
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  retrySingleModel: (modelId: string, content: string) => void;
  dismissPending: (modelId: string) => void;
  copyConsultantResponse: (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => Promise<void>;
  handleDChatExpand: () => void;
  setDChatContext: React.Dispatch<React.SetStateAction<{
    messageId: string;
    content: string;
    sourceMessages?: Array<{ role: string; model_name: string | null; content: string }>;
  } | null>>;
}

export function useExpertPanelActions({
  userId,
  sessionId,
  messages,
  selectedModels,
  setSelectedModels,
  setInput,
  retrySingleModel,
  dismissPending,
  copyConsultantResponse,
  handleDChatExpand,
  setDChatContext,
}: UseExpertPanelActionsOptions) {
  const { t } = useLanguage();
  const { incrementResponse, incrementDismissal, incrementHallucination } = useModelStatistics(userId || undefined);

  // Retry a timed-out request
  const handleRetryRequest = useCallback((modelId: string) => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      toast.error('Не найдено последнее сообщение пользователя');
      return;
    }
    dismissPending(modelId);
    retrySingleModel(modelId, lastUserMessage.content);
    toast.success(`Повторный запрос отправлен: ${modelId.split('/').pop()}`);
  }, [messages, retrySingleModel, dismissPending]);

  // Dismiss timeout
  const handleDismissTimeout = useCallback((_modelId: string) => {
    dismissPending(_modelId);
    toast.info('Ожидание отменено');
  }, [dismissPending]);

  // Remove model from session
  const handleRemoveModel = useCallback((modelId: string) => {
    setSelectedModels(prev => prev.filter(id => id !== modelId));
    if (sessionId) {
      incrementDismissal(modelId, sessionId);
    }
    toast.warning(`Модель ${modelId.split('/').pop()} удалена из сессии`);
  }, [setSelectedModels, sessionId, incrementDismissal]);

  // Request proposal details
  const handleRequestProposalDetails = useCallback(async (messageId: string, proposalIds: string[]) => {
    const sourceMessage = messages.find(m => m.id === messageId);
    if (!sourceMessage) {
      toast.error('Исходное сообщение не найдено');
      return;
    }
    const metadata = sourceMessage.metadata as { proposals?: { id: string; title: string }[] } | null;
    const proposals = metadata?.proposals || [];
    const selectedProposals = proposals.filter(p => proposalIds.includes(p.id));
    const proposalTitles = selectedProposals.map(p => `"${p.title}"`).join(', ');

    const followUpMessage = `Прошу подробнее раскрыть следующие предложения: ${proposalTitles || proposalIds.join(', ')}. 

Для каждого из них:
1. Детально опиши шаги реализации
2. Укажи потенциальные риски и способы их минимизации
3. Оцени необходимые ресурсы и сроки`;

    setInput(followUpMessage);
    toast.success('Запрос деталей подготовлен. Нажмите отправить.');
  }, [messages, setInput]);

  // Send to D-Chat with full context
  const handleSendToDChat = useCallback((
    messageId: string,
    aggregatedContent: string,
    sourceMessages: Array<{ role: string; model_name: string | null; content: string }>
  ) => {
    setDChatContext({ messageId, content: aggregatedContent, sourceMessages });
    handleDChatExpand();
  }, [handleDChatExpand, setDChatContext]);

  // Consult specific message in D-Chat
  const handleConsultInDChat = useCallback((messageId: string, content: string) => {
    setDChatContext({ messageId, content });
    handleDChatExpand();
  }, [handleDChatExpand, setDChatContext]);

  // Copy D-Chat response to main chat
  const handleCopyToMainChat = useCallback(async (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => {
    await copyConsultantResponse(content, sourceMessageId, modelName, role);
    toast.success(t('dchat.copiedToChat'));
  }, [copyConsultantResponse, t]);

  // Clear D-Chat context
  const handleClearDChatContext = useCallback(() => {
    setDChatContext(null);
  }, [setDChatContext]);

  // Clarify selected text with specialist
  const handleClarifyWithSpecialist = useCallback((selectedText: string, messageId: string) => {
    const sourceMessage = messages.find(m => m.id === messageId);
    const contextMessages = sourceMessage ? [{
      role: sourceMessage.role,
      model_name: sourceMessage.model_name,
      content: sourceMessage.content
    }] : undefined;
    
    setDChatContext({
      messageId,
      content: selectedText,
      sourceMessages: contextMessages
    });
    handleDChatExpand();
  }, [messages, handleDChatExpand, setDChatContext]);

  // Flag hallucination
  const handleHallucination = useCallback((messageId: string, modelName: string | null, _sessionId: string) => {
    if (!modelName || !_sessionId) return;
    incrementHallucination(modelName, _sessionId);
    toast.info('Галлюцинация зафиксирована');
  }, [incrementHallucination]);

  // Request Arbiter evaluation
  const handleRequestEvaluation = useCallback((messageId: string, content: string, modelName: string | null) => {
    const evaluationPrompt = `Оцени следующий ответ модели ${modelName || 'ИИ'} по критериям:
1. **Точность** (0-10): насколько ответ корректен и соответствует запросу
2. **Полнота** (0-10): насколько ответ исчерпывающий
3. **Ясность** (0-10): насколько ответ понятен и хорошо структурирован
4. **Практичность** (0-10): насколько ответ применим

Формат ответа:
| Критерий | Балл | Обоснование |
|----------|------|-------------|
...

**Итоговая оценка:** X/10

---
**Ответ для оценки:**
${content.slice(0, 2000)}${content.length > 2000 ? '\n...(сокращено)' : ''}`;

    setDChatContext({
      messageId,
      content: evaluationPrompt,
      sourceMessages: [{
        role: 'assistant',
        model_name: modelName,
        content: content
      }]
    });
    handleDChatExpand();
    toast.info(t('dchat.evaluationRequested'));
  }, [handleDChatExpand, t, setDChatContext]);

  // Track model response completion
  const handleResponseComplete = useCallback((modelId: string, role: string) => {
    if (sessionId) {
      incrementResponse(modelId, sessionId, role);
    }
  }, [sessionId, incrementResponse]);

  return {
    handleRetryRequest,
    handleDismissTimeout,
    handleRemoveModel,
    handleRequestProposalDetails,
    handleSendToDChat,
    handleConsultInDChat,
    handleCopyToMainChat,
    handleClearDChatContext,
    handleClarifyWithSpecialist,
    handleHallucination,
    handleRequestEvaluation,
    handleResponseComplete,
  };
}
