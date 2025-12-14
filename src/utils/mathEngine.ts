import {
  all,
  create,
  FunctionNode,
  MathNode,
  OperatorNode,
  ParenthesisNode,
  SymbolNode
} from 'mathjs';

export type AngleMode = 'DEG' | 'RAD';

const math = create(all, { number: 'number', precision: 14 });

// Disable mutation-oriented helpers that are not needed in this exam-safe build.
math.import(
  {
    import: () => {
      throw new Error('Dynamic import is disabled');
    },
    createUnit: () => {
      throw new Error('Unit creation is disabled');
    },
    evaluate: () => {
      throw new Error('Nested evaluation is disabled');
    }
  },
  { override: true }
);

const allowedSymbols = new Set(['pi', 'e', 'ans']);
const allowedFunctions = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'log10',
  'sqrt',
  'exp'
]);

const functionArity: Record<string, number> = {
  sin: 1,
  cos: 1,
  tan: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  log: 1,
  ln: 1,
  log10: 1,
  sqrt: 1,
  exp: 1
};

const allowedOperators = new Set(['+', '-', '*', '/', '^']);

const toRadians = (value: number, mode: AngleMode) =>
  mode === 'DEG' ? (value * Math.PI) / 180 : value;

const fromRadians = (value: number, mode: AngleMode) =>
  mode === 'DEG' ? (value * 180) / Math.PI : value;

const normalizeInput = (expression: string): string =>
  expression
    .replace(/π/g, 'pi')
    .replace(/[×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/[–−]/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/ANS/gi, 'ans')
    .replace(/\s+/g, '');

const isNodeSafe = (node: MathNode): boolean => {
  switch (node.type) {
    case 'ConstantNode':
      return true;
    case 'SymbolNode': {
      const symbolNode = node as SymbolNode;
      return allowedSymbols.has(symbolNode.name);
    }
    case 'ParenthesisNode': {
      const parenthesisNode = node as ParenthesisNode;
      return isNodeSafe(parenthesisNode.content);
    }
    case 'OperatorNode': {
      const operatorNode = node as OperatorNode;
      if (!allowedOperators.has(operatorNode.op)) return false;
      return operatorNode.args.every(isNodeSafe);
    }
    case 'FunctionNode': {
      const functionNode = node as FunctionNode;
      if (!allowedFunctions.has(functionNode.name)) return false;
      const expectedArity = functionArity[functionNode.name];
      if (
        typeof expectedArity === 'number' &&
        functionNode.args.length !== expectedArity
      ) {
        return false;
      }
      return functionNode.args.every(isNodeSafe);
    }
    default:
      return false;
  }
};

const ensureSafeExpression = (expression: string): MathNode => {
  const normalized = normalizeInput(expression);
  const parsed = math.parse(normalized);
  if (!isNodeSafe(parsed)) {
    throw new Error('Unsupported or unsafe expression');
  }
  return parsed;
};

const buildScope = (angleMode: AngleMode, ansValue: number) => ({
  sin: (x: number) => math.sin(toRadians(x, angleMode)),
  cos: (x: number) => math.cos(toRadians(x, angleMode)),
  tan: (x: number) => math.tan(toRadians(x, angleMode)),
  asin: (x: number) => fromRadians(math.asin(x), angleMode),
  acos: (x: number) => fromRadians(math.acos(x), angleMode),
  atan: (x: number) => fromRadians(math.atan(x), angleMode),
  log: (x: number) => math.log(x),
  ln: (x: number) => math.log(x),
  log10: (x: number) => math.log10(x),
  sqrt: (x: number) => math.sqrt(x),
  exp: (x: number) => math.exp(x),
  pi: math.pi,
  e: math.e,
  ans: ansValue
});

export const evaluateExpression = (
  expression: string,
  angleMode: AngleMode,
  ansValue = 0
) => {
  if (!expression.trim()) {
    throw new Error('Enter an expression to evaluate.');
  }

  const parsed = ensureSafeExpression(expression);
  const compiled = parsed.compile();
  const scope = buildScope(angleMode, ansValue);
  const value = compiled.evaluate(scope);

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Expression did not produce a finite number.');
  }

  const result = math.format(value, {
    precision: 12,
    lowerExp: -6,
    upperExp: 15
  });

  return { value, result };
};

