/**
 * Parser for converting expert strategy markdown responses into
 * hierarchical approval sections.
 * 
 * Handles the 3-level structure (Phase → Aspect → Task) by merging
 * the top two levels: "Фаза N: Аспект" becomes a single aspect node.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'rework';

export interface ApprovalSection {
  id: string;
  /** Section title (e.g. "Фаза 1: Инфраструктура данных") */
  title: string;
  /** Original AI-generated title (for rename detection) */
  originalTitle: string;
  /** Editable body text */
  body: string;
  /** Original AI-generated body (for diff/self-learning) */
  originalBody: string;
  /** Current approval status */
  status: ApprovalStatus;
  /** User comment (for reject/rework) */
  userComment: string;
  /** Nesting depth: 0 = aspect, 1 = task */
  depth: number;
  /** Children tasks */
  children: ApprovalSection[];
  /** Source expert type */
  source: 'visionary' | 'strategist' | 'patent';
}

let _idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++_idCounter}`;
}

/**
 * Detects if a line is a heading and returns its level and text.
 */
function parseHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,4})\s+(.+)$/);
  if (match) return { level: match[1].length, text: match[2].trim() };
  return null;
}

/**
 * Detects phase headers like "Фаза 1:", "Phase 1:", "Этап 1:" etc.
 */
function parsePhaseLabel(text: string): string | null {
  const match = text.match(/^(?:фаза|phase|этап)\s*(\d+)\b[:\s.-]*/i);
  if (match) return match[0].replace(/[:\s.-]+$/, '');
  return null;
}

/**
 * Parses a strategist markdown response into approval sections.
 * 
 * Expected structure:
 * # Main Title
 * ## Фаза 1: Название фазы
 * ### Аспект 1.1: Название
 * - Задача 1
 * - Задача 2
 * ### Аспект 1.2: Название
 * ...
 * 
 * Output: flat list of aspects with prefix "Фаза N: Аспект Name"
 * and children tasks inside.
 */
export function parseStrategyMarkdown(
  markdown: string, 
  source: ApprovalSection['source'] = 'strategist'
): ApprovalSection[] {
  if (!markdown?.trim()) return [];
  
  _idCounter = 0;
  const lines = markdown.split('\n');
  const result: ApprovalSection[] = [];
  
  let currentPhaseLabel = '';
  let currentAspect: ApprovalSection | null = null;
  let currentTask: { lines: string[] } | null = null;
  let bodyLines: string[] = [];

  function flushTask() {
    if (currentTask && currentAspect) {
      const taskText = currentTask.lines.join('\n').trim();
      if (taskText) {
        const taskTitle = extractTaskTitle(taskText);
        currentAspect.children.push({
          id: nextId('task'),
          title: taskTitle,
          originalTitle: taskTitle,
          body: taskText,
          originalBody: taskText,
          status: 'pending',
          userComment: '',
          depth: 1,
          children: [],
          source,
        });
      }
    }
    currentTask = null;
  }

  function flushAspect() {
    flushTask();
    if (currentAspect) {
      // If aspect has accumulated body lines but no children, 
      // add body content to aspect
      if (bodyLines.length > 0) {
        const body = bodyLines.join('\n').trim();
        if (body && currentAspect.children.length === 0) {
          currentAspect.body = body;
          currentAspect.originalBody = body;
        } else if (body) {
          // Prepend to aspect body
          currentAspect.body = body + (currentAspect.body ? '\n' + currentAspect.body : '');
          currentAspect.originalBody = currentAspect.body;
        }
      }
      result.push(currentAspect);
    }
    currentAspect = null;
    bodyLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = parseHeading(line);

    if (heading) {
      if (heading.level === 1) {
        // Main title — skip
        continue;
      }

      if (heading.level === 2) {
        flushAspect();
        
        // Check if this is a phase header
        const phaseLabel = parsePhaseLabel(heading.text);
        if (phaseLabel) {
          // Extract the rest of the title after the phase label
          const afterPhase = heading.text.replace(/^(?:фаза|phase|этап)\s*\d+\b[:\s.-]*/i, '').trim();
          currentPhaseLabel = phaseLabel;
          
          if (afterPhase) {
            // "## Фаза 1: Инфраструктура" → aspect titled "Фаза 1: Инфраструктура"
            currentAspect = createAspect(`${currentPhaseLabel}: ${afterPhase}`, source);
          }
          // If no text after phase label, it's just a phase grouper;
          // subsequent h3s will become aspects with phase prefix
          continue;
        }
        
        // Not a phase — it's a standalone aspect
        currentAspect = createAspect(
          currentPhaseLabel ? `${currentPhaseLabel}: ${heading.text}` : heading.text,
          source
        );
        continue;
      }

      if (heading.level === 3) {
        flushTask();
        // Save body lines accumulated for parent aspect
        if (currentAspect && bodyLines.length > 0) {
          const body = bodyLines.join('\n').trim();
          if (body) {
            currentAspect.body = body;
            currentAspect.originalBody = body;
          }
          bodyLines = [];
        }

        // h3 under a phase → becomes an aspect with phase prefix
        if (!currentAspect && currentPhaseLabel) {
          currentAspect = createAspect(`${currentPhaseLabel}: ${heading.text}`, source);
          continue;
        }
        
        if (currentAspect && currentPhaseLabel && currentAspect.children.length === 0 && !currentAspect.body) {
          // First h3 after a phase-only h2: turn into the aspect itself
          currentAspect.title = `${currentPhaseLabel}: ${heading.text}`;
          continue;
        }

        // h3 under an existing aspect with content → new sub-aspect
        if (currentAspect) {
          flushAspect();
          currentAspect = createAspect(
            currentPhaseLabel ? `${currentPhaseLabel}: ${heading.text}` : heading.text,
            source
          );
          continue;
        }

        // Standalone h3 → create aspect
        currentAspect = createAspect(heading.text, source);
        continue;
      }

      if (heading.level === 4) {
        // h4 → task header
        flushTask();
        if (!currentAspect) {
          currentAspect = createAspect(
            currentPhaseLabel ? `${currentPhaseLabel}: Общее` : 'Общее',
            source
          );
        }
        currentTask = { lines: [heading.text] };
        continue;
      }
    }

    // List items → tasks
    const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const itemText = listMatch[2].trim();
      
      if (indent < 4 && currentAspect) {
        // Top-level list item → new task
        flushTask();
        currentTask = { lines: [itemText] };
      } else if (currentTask) {
        // Sub-item → append to current task
        currentTask.lines.push('  • ' + itemText);
      } else if (currentAspect) {
        // Orphan list item → new task
        currentTask = { lines: [itemText] };
      }
      continue;
    }

    // Numbered list items → tasks
    const numberedMatch = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      const indent = numberedMatch[1].length;
      const itemText = numberedMatch[2].trim();
      
      if (indent < 4 && currentAspect) {
        flushTask();
        currentTask = { lines: [itemText] };
      } else if (currentTask) {
        currentTask.lines.push('  • ' + itemText);
      } else if (currentAspect) {
        currentTask = { lines: [itemText] };
      }
      continue;
    }

    // Regular text → accumulate as body
    if (line.trim()) {
      if (currentTask) {
        currentTask.lines.push(line);
      } else {
        bodyLines.push(line);
      }
    }
  }

  // Flush remaining
  flushAspect();

  return result;
}

function createAspect(title: string, source: ApprovalSection['source']): ApprovalSection {
  return {
    id: nextId('aspect'),
    title,
    originalTitle: title,
    body: '',
    originalBody: '',
    status: 'pending',
    userComment: '',
    depth: 0,
    children: [],
    source,
  };
}

function extractTaskTitle(text: string): string {
  // Take first line as title
  const firstLine = text.split('\n')[0];
  // Remove bold markers
  return firstLine.replace(/\*\*/g, '').trim();
}

/**
 * Combines sections from multiple experts into a unified list.
 */
export function combineExpertSections(
  visionarySections: ApprovalSection[],
  strategistSections: ApprovalSection[],
  patentSections: ApprovalSection[],
): ApprovalSection[] {
  return [...visionarySections, ...strategistSections, ...patentSections];
}

/**
 * Computes a diff summary between original and edited content.
 */
export function computeApprovalDiff(sections: ApprovalSection[]): {
  approved: number;
  rejected: number;
  rework: number;
  edited: number;
  renamed: number;
  total: number;
} {
  let approved = 0, rejected = 0, rework = 0, edited = 0, renamed = 0, total = 0;

  function walk(items: ApprovalSection[]) {
    for (const s of items) {
      total++;
      if (s.status === 'approved') approved++;
      else if (s.status === 'rejected') rejected++;
      else if (s.status === 'rework') rework++;
      if (s.body !== s.originalBody) edited++;
      if (s.title !== s.originalTitle) renamed++;
      walk(s.children);
    }
  }

  walk(sections);
  return { approved, rejected, rework, edited, renamed, total };
}

/**
 * Serializes sections for storage in metadata.
 */
export function sectionsToJson(sections: ApprovalSection[]): unknown {
  return sections.map(s => ({
    id: s.id,
    title: s.title,
    originalTitle: s.originalTitle,
    body: s.body,
    originalBody: s.originalBody,
    status: s.status,
    userComment: s.userComment,
    depth: s.depth,
    source: s.source,
    children: sectionsToJson(s.children),
  }));
}

/**
 * Deserializes sections from stored JSON.
 */
export function sectionsFromJson(json: unknown): ApprovalSection[] {
  if (!Array.isArray(json)) return [];
  return json.map((item: any) => ({
    id: item.id || nextId('restored'),
    title: item.title || '',
    originalTitle: item.originalTitle || item.title || '',
    body: item.body || '',
    originalBody: item.originalBody || '',
    status: item.status || 'pending',
    userComment: item.userComment || '',
    depth: item.depth ?? 0,
    source: item.source || 'strategist',
    children: sectionsFromJson(item.children),
  }));
}
