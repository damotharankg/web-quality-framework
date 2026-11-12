import { ConsoleMessageItem, SeverityLevel } from '../../config/types.js';

interface KnownIssuePattern {
  id: string;
  category: 'react' | 'vue' | 'angular' | 'network' | 'runtime' | 'deprecation' | 'unhandled';
  severity: SeverityLevel;
  pattern: RegExp;
  title: string;
  remediation: string;
  frameworkNote?: string;
}

export const KNOWN_CONSOLE_PATTERNS: KnownIssuePattern[] = [
  // React Warnings
  {
    id: 'REACT-KEY-001',
    category: 'react',
    severity: 'medium',
    pattern: /Each child in a list should have a unique ['"]key['"] prop/i,
    title: 'Missing Unique React List Key',
    remediation: 'Provide a stable unique identifier to each element returned in array.map(): <Item key={item.id} />. Avoid using array indexes as keys if items can reorder.',
    frameworkNote: 'React uses keys to efficiently reconcile DOM subtrees. Missing keys cause severe rendering bugs and performance degradation.',
  },
  {
    id: 'REACT-UNMOUNT-002',
    category: 'react',
    severity: 'medium',
    pattern: /Can't perform a React state update on an unmounted component/i,
    title: 'State Update on Unmounted Component (Memory Leak)',
    remediation: 'Cancel async operations or set an `isMounted` flag inside useEffect cleanup: `useEffect(() => { let mounted = true; fetch(...).then(d => { if (mounted) setState(d); }); return () => { mounted = false; }; }, [])`.',
    frameworkNote: 'Indicates a memory leak in asynchronous callbacks or timers.',
  },
  {
    id: 'REACT-PROP-003',
    category: 'react',
    severity: 'low',
    pattern: /Invalid DOM property [`'"]([^`'"]+)[`'"]\. Did you mean [`'"]([^`'"]+)[`'"]/i,
    title: 'Invalid DOM Property in JSX',
    remediation: 'Replace the invalid HTML attribute with the JSX standard prop (e.g. rename class -> className, for -> htmlFor).',
    frameworkNote: 'JSX requires camelCase DOM properties rather than HTML attribute names.',
  },
  {
    id: 'REACT-CONTROLLED-004',
    category: 'react',
    severity: 'medium',
    pattern: /A component is changing an (uncontrolled|controlled) (input|textarea|select) to be (controlled|uncontrolled)/i,
    title: 'Uncontrolled to Controlled Input Transition',
    remediation: 'Initialize the state value to an empty string `""` or default value instead of `undefined` or `null`: const [val, setVal] = useState("").',
    frameworkNote: 'Prevents input form loss of cursor state and inconsistent validation.',
  },
  {
    id: 'REACT-HOOK-DEP-005',
    category: 'react',
    severity: 'medium',
    pattern: /React Hook [a-zA-Z]+ has a missing dependency/i,
    title: 'Missing Hook Dependency',
    remediation: 'Add all referenced state and props to the dependency array, or memoize handlers with useCallback/useMemo.',
    frameworkNote: 'Stale closures cause components to reference outdated state values.',
  },

  // Vue Warnings
  {
    id: 'VUE-PROP-MUTATE-001',
    category: 'vue',
    severity: 'medium',
    pattern: /Avoid mutating a prop directly/i,
    title: 'Direct Prop Mutation in Vue',
    remediation: 'Emit an event to parent ($emit("update:prop", val)) or initialize a local ref/reactive copy.',
    frameworkNote: 'Props are one-way downward bindings. Mutating them causes unpredictable parent-child state synchronization.',
  },
  {
    id: 'VUE-DUP-KEY-002',
    category: 'vue',
    severity: 'medium',
    pattern: /Duplicate keys detected:? ['"]?([^'"]+)['"]?/i,
    title: 'Duplicate v-for Key in Vue',
    remediation: 'Ensure each item in v-for has a globally unique :key within the list.',
    frameworkNote: 'Duplicate keys cause virtual DOM diffing errors.',
  },

  // Angular Warnings
  {
    id: 'NG-CHANGED-001',
    category: 'angular',
    severity: 'high',
    pattern: /ExpressionChangedAfterItHasBeenCheckedError|NG0100/i,
    title: 'Angular ExpressionChangedAfterItHasBeenCheckedError',
    remediation: 'Avoid updating component bindings during ngAfterViewInit. Move state changes to ngOnInit, wrap in setTimeout, or trigger cdr.detectChanges().',
    frameworkNote: 'Violates unidirectional data flow guarantees in Angular Change Detection.',
  },
  {
    id: 'NG-INJECTOR-002',
    category: 'angular',
    severity: 'high',
    pattern: /NullInjectorError|NG0201/i,
    title: 'Angular NullInjectorError (Missing Provider)',
    remediation: 'Add the missing service to the module `providers: [...]` or annotate service with `@Injectable({ providedIn: \'root\' })`.',
    frameworkNote: 'Dependency injection failed to locate a registered token.',
  },

  // Network & Resource Errors
  {
    id: 'NET-ERR-404',
    category: 'network',
    severity: 'high',
    pattern: /Failed to load resource: the server responded with a status of (404|500|502|503)/i,
    title: 'HTTP Resource Load Failure',
    remediation: 'Verify resource URL, ensure asset is deployed in public root, and inspect API route handler for internal server errors.',
  },
  {
    id: 'NET-ERR-CORS',
    category: 'network',
    severity: 'high',
    pattern: /blocked by CORS policy|No 'Access-Control-Allow-Origin' header/i,
    title: 'Cross-Origin Request Blocked by CORS',
    remediation: 'Configure Access-Control-Allow-Origin and allowed methods on the API server, or setup a reverse proxy.',
  },

  // Unhandled Exceptions
  {
    id: 'RUNTIME-NULL-REF',
    category: 'unhandled',
    severity: 'critical',
    pattern: /Cannot read propert(y|ies) of (undefined|null)|is not a function/i,
    title: 'Null/Undefined Reference Exception',
    remediation: 'Add defensive null-checks or optional chaining `obj?.property?.()` to prevent catastrophic UI crashes.',
  },
  {
    id: 'RUNTIME-PROMISE-REJECT',
    category: 'unhandled',
    severity: 'high',
    pattern: /Uncaught \(in promise\)|UnhandledPromiseRejection/i,
    title: 'Unhandled Promise Rejection',
    remediation: 'Attach `.catch(error => { ... })` or wrap asynchronous `await` calls in a `try/catch` block.',
  },
];

export class ConsoleMessageCategorizer {
  public static categorize(rawMessage: string, type: 'error' | 'warn' | 'info' | 'log' = 'error'): {
    category: ConsoleMessageItem['category'];
    severity: SeverityLevel;
    title: string;
    remediation: string;
    frameworkNote?: string;
  } {
    for (const rule of KNOWN_CONSOLE_PATTERNS) {
      if (rule.pattern.test(rawMessage)) {
        return {
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          remediation: rule.remediation,
          frameworkNote: rule.frameworkNote,
        };
      }
    }

    // Default classification
    const severity: SeverityLevel = type === 'error' ? 'high' : 'medium';
    return {
      category: 'runtime',
      severity,
      title: type === 'error' ? 'Unclassified Runtime Error' : 'Unclassified Console Warning',
      remediation: 'Inspect stack trace, locate originating line in source code, and resolve root cause.',
    };
  }

  public static aggregateMessages(messages: ConsoleMessageItem[]): ConsoleMessageItem[] {
    const aggregated = new Map<string, ConsoleMessageItem>();

    for (const msg of messages) {
      // Create a signature based on message content without volatile timestamps or random IDs
      const signature = `${msg.type}:${msg.message.replace(/0x[a-f0-9]+/gi, '').replace(/\d{6,}/g, '')}`;

      if (aggregated.has(signature)) {
        const existing = aggregated.get(signature)!;
        existing.occurrences += msg.occurrences || 1;
      } else {
        aggregated.set(signature, { ...msg });
      }
    }

    return Array.from(aggregated.values());
  }
}

