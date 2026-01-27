
## План: Извлечение текста из документов (DOCX/PDF)

### Цель
Позволить AI-моделям анализировать содержимое DOCX и PDF файлов путём извлечения текста и добавления его к промпту.

---

### Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    hydra-orchestrator                            │
│                                                                  │
│  attachments[]                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  processDocumentAttachments(attachments)                 │    │
│  │                                                          │    │
│  │  for each attachment:                                    │    │
│  │    ├─ image/* → передать как есть (multimodal)          │    │
│  │    ├─ application/pdf → extractTextFromPDF()            │    │
│  │    └─ application/vnd...docx → extractTextFromDOCX()    │    │
│  │                                                          │    │
│  │  return: { images[], documentTexts[] }                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  buildEnhancedPrompt(message, documentTexts)             │    │
│  │                                                          │    │
│  │  "Пользователь приложил документы:                       │    │
│  │   --- Документ: report.pdf ---                           │    │
│  │   [извлечённый текст]                                    │    │
│  │   ---                                                    │    │
│  │   Вопрос пользователя: [оригинальное сообщение]"        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│              AI модели получают полный контекст                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Технические детали

#### 1. Библиотеки для Deno Edge Function

| Тип файла | Библиотека | Импорт |
|-----------|------------|--------|
| PDF | pdfjs-serverless | `https://esm.sh/pdfjs-serverless` |
| DOCX | mammoth | `https://esm.sh/mammoth` |

**Почему эти библиотеки:**
- `pdfjs-serverless` — специально собран для serverless/Deno, без зависимости от Node.js
- `mammoth` — легковесный, работает с ArrayBuffer, поддерживается через esm.sh

#### 2. Изменения в `hydra-orchestrator/index.ts`

**Новые функции:**

```typescript
// Загрузка файла по URL
async function fetchFileAsArrayBuffer(url: string): Promise<ArrayBuffer>

// Извлечение текста из PDF
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string>

// Извлечение текста из DOCX
async function extractTextFromDOCX(buffer: ArrayBuffer): Promise<string>

// Обработка всех документов
async function processDocumentAttachments(attachments: Attachment[]): Promise<{
  images: Attachment[];
  documentTexts: { name: string; text: string }[];
}>

// Формирование расширенного промпта
function buildEnhancedMessage(
  originalMessage: string, 
  documentTexts: { name: string; text: string }[]
): string
```

**Модификация основного потока:**
- Перед вызовом AI-модели вызвать `processDocumentAttachments()`
- Передавать изображения по-прежнему как multimodal
- Текст документов добавлять к сообщению пользователя

#### 3. Формат расширенного промпта

```text
Пользователь приложил следующие документы к своему запросу:

--- Документ: quarterly_report.pdf ---
[извлечённый текст из PDF, до 50000 символов]
--- Конец документа ---

--- Документ: specification.docx ---
[извлечённый текст из DOCX]
--- Конец документа ---

=== Вопрос пользователя ===
[оригинальное сообщение]
```

#### 4. Ограничения и обработка ошибок

| Ограничение | Значение | Обработка |
|-------------|----------|-----------|
| Макс. размер текста из одного документа | 50,000 символов | Обрезать с пометкой "[текст обрезан...]" |
| Таймаут загрузки файла | 30 секунд | Пропустить файл, добавить в errors |
| Неподдерживаемый формат | .txt, .md, и др. | Пока игнорировать (можно добавить позже) |
| Ошибка парсинга | Повреждённый файл | Логировать, пропустить, уведомить в ответе |

#### 5. Поддерживаемые MIME-типы

```typescript
const DOCUMENT_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};
```

---

### Шаги реализации

1. **Добавить импорты библиотек** в начало файла
2. **Создать функцию `fetchFileAsArrayBuffer()`** для загрузки файлов из Storage
3. **Создать функцию `extractTextFromPDF()`** с использованием pdfjs-serverless
4. **Создать функцию `extractTextFromDOCX()`** с использованием mammoth
5. **Создать функцию `processDocumentAttachments()`** для разделения и обработки
6. **Создать функцию `buildEnhancedMessage()`** для формирования промпта
7. **Модифицировать основной обработчик** для использования новых функций
8. **Добавить логирование** для отладки
9. **Протестировать** с реальными PDF и DOCX файлами

---

### Примерная структура кода

```typescript
import { getDocument } from "https://esm.sh/pdfjs-serverless";
import mammoth from "https://esm.sh/mammoth";

const MAX_DOCUMENT_TEXT_LENGTH = 50000;

async function fetchFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  return response.arrayBuffer();
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const textParts: string[] = [];
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
}

async function extractTextFromDOCX(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}
```

---

### Ожидаемый результат

После реализации:
- AI-модели смогут анализировать содержимое PDF и DOCX файлов
- Пользователь увидит осмысленные ответы на вопросы о документах
- Изображения продолжат работать как multimodal input
- При ошибках парсинга пользователь получит понятное сообщение

---

### Время реализации
~10-15 минут реального времени (3-5 итераций AI)
