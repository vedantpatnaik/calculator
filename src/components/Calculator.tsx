import { useCallback, useEffect, useMemo, useState } from 'react';
import { AngleMode, evaluateExpression } from '../utils/mathEngine';
import '../styles/calculator.css';

type ButtonAction =
  | 'evaluate'
  | 'clear'
  | 'all-clear'
  | 'backspace'
  | 'toggle-angle'
  | 'square'
  | 'ans';

type ButtonConfig = {
  label: string;
  value?: string;
  action?: ButtonAction;
  functionName?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  span?: number;
};

const tokenizeDisplay = (expr: string): string[] => {
  const tokenRegex =
    /(sin|cos|tan|asin|acos|atan|sqrt|log10|log|ln|exp|ans|pi|e|\d*\.\d+|\d+|[()+\-^×÷/])/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(expr)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
};

const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [error, setError] = useState('');
  const [lastAnswer, setLastAnswer] = useState<number>(0);
  const [pendingClosers, setPendingClosers] = useState(0);

  const functionButtons = useMemo<ButtonConfig[]>(
    () => [
      { label: 'AC', action: 'all-clear', variant: 'secondary' },
      { label: 'C', action: 'clear', variant: 'secondary' },
      { label: '⌫', action: 'backspace', variant: 'secondary' },
      { label: 'DEG/RAD', action: 'toggle-angle', variant: 'ghost' },
      { label: 'π', value: 'π' },
      { label: 'e', value: 'e' },
      { label: 'sin', functionName: 'sin' },
      { label: 'cos', functionName: 'cos' },
      { label: 'tan', functionName: 'tan' },
      { label: 'sin⁻¹', functionName: 'asin' },
      { label: 'cos⁻¹', functionName: 'acos' },
      { label: 'tan⁻¹', functionName: 'atan' },
      { label: 'ln', functionName: 'ln' },
      { label: 'log', functionName: 'log10' },
      { label: '√x', functionName: 'sqrt' },
      { label: 'x²', action: 'square' },
      { label: 'x^y', value: '^' },
      { label: 'e^x', functionName: 'exp' }
    ],
    []
  );

  const mainButtons = useMemo<ButtonConfig[]>(
    () => [
      { label: '(', value: '(' },
      { label: ')', value: ')' },
      { label: 'a/b', value: '/' },
      { label: '÷', value: '÷' },
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '×', value: '×' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '-', value: '-' },
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '+', value: '+' },
      { label: '0', value: '0' },
      { label: '.', value: '.' },
      { label: 'Ans', action: 'ans' },
      { label: '=', action: 'evaluate', variant: 'primary' }
    ],
    []
  );

  const insertValue = useCallback(
    (value: string, placeInsideAutoClose = true) => {
      setExpression((prev) => {
        if (placeInsideAutoClose && pendingClosers > 0 && prev.endsWith(')')) {
          const insertPos = prev.lastIndexOf(')');
          if (insertPos !== -1) {
            return `${prev.slice(0, insertPos)}${value}${prev.slice(insertPos)}`;
          }
        }
        return `${prev}${value}`;
      });
      setError('');
    },
    [pendingClosers]
  );

  const handleInput = useCallback(
    (value: string) => {
      insertValue(value, true);
    },
    [insertValue]
  );

  const handleBackspace = useCallback(() => {
    setExpression((prev) => {
      if (prev.endsWith(')') && pendingClosers > 0) {
        setPendingClosers((c) => Math.max(0, c - 1));
      }
      return prev.slice(0, -1);
    });
    setError('');
  }, [pendingClosers]);

  const handleClear = useCallback(() => {
    setExpression('');
    setError('');
    setPendingClosers(0);
  }, []);

  const handleAllClear = useCallback(() => {
    setExpression('');
    setResult('');
    setError('');
    setLastAnswer(0);
    setPendingClosers(0);
  }, []);

  const handleSquare = useCallback(() => {
    setExpression((prev) => (prev ? `${prev}^2` : prev));
    setError('');
  }, []);

  const handleFunctionInsert = useCallback(
    (fnName: string) => {
      insertValue(`${fnName}()`, true);
      setPendingClosers((c) => c + 1);
    },
    [insertValue]
  );

  const handleValueInput = useCallback(
    (value: string) => {
      if (value === ')') {
        if (pendingClosers > 0) {
          setPendingClosers(0);
          return;
        }
        insertValue(value, false);
        return;
      }

      insertValue(value, true);
    },
    [insertValue, pendingClosers]
  );

  const handleEvaluate = useCallback(() => {
    try {
      const { result: formatted, value } = evaluateExpression(
        expression,
        angleMode,
        lastAnswer
      );
      setResult(formatted);
      setLastAnswer(value);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid expression';
      setError(message);
    }
  }, [angleMode, expression, lastAnswer]);

  const handleAns = useCallback(() => {
    insertValue('ans', true);
  }, [insertValue]);

  const toggleAngle = useCallback(() => {
    setAngleMode((prev) => (prev === 'DEG' ? 'RAD' : 'DEG'));
  }, []);

  const handleButton = useCallback(
    (button: ButtonConfig) => {
      switch (button.action) {
        case 'clear':
          return handleClear();
        case 'all-clear':
          return handleAllClear();
        case 'backspace':
          return handleBackspace();
        case 'toggle-angle':
          return toggleAngle();
        case 'square':
          return handleSquare();
        case 'evaluate':
          return handleEvaluate();
        case 'ans':
          return handleAns();
        default:
          break;
      }

      if (button.functionName) {
        return handleFunctionInsert(button.functionName);
      }

      if (button.value) {
        handleValueInput(button.value);
      }
    },
    [
      handleAllClear,
      handleAns,
      handleBackspace,
      handleClear,
      handleEvaluate,
      handleFunctionInsert,
      handleValueInput,
      handleSquare,
      toggleAngle
    ]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;

      if (/^[0-9]$/.test(key)) {
        handleInput(key);
        return;
      }

      if (key === '.') {
        handleInput('.');
        return;
      }

      if (key === '(' || key === ')') {
        handleInput(key);
        return;
      }

      if (key === '+' || key === '-') {
        handleInput(key);
        return;
      }

      if (key === '*') {
        event.preventDefault();
        handleInput('×');
        return;
      }

      if (key === '/') {
        event.preventDefault();
        handleInput('÷');
        return;
      }

      if (key === '^') {
        handleInput('^');
        return;
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault();
        handleEvaluate();
        return;
      }

      if (key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (key === 'Delete') {
        event.preventDefault();
        handleClear();
        return;
      }

      if (key === 'Escape') {
        event.preventDefault();
        handleAllClear();
        return;
      }
    },
    [
      handleAllClear,
      handleBackspace,
      handleClear,
      handleEvaluate,
      handleInput
    ]
  );

  const renderDisplay = useCallback(
    (expr: string) => {
      const tokens = tokenizeDisplay(expr);
      const nodes: JSX.Element[] = [];
      let i = 0;

      while (i < tokens.length) {
        const current = tokens[i];
        const next = tokens[i + 1];
        const nextNext = tokens[i + 2];

        if (next === '/' && nextNext) {
          nodes.push(
            <span className="fraction" key={`frac-${i}`}>
              <span className="num">{current}</span>
              <span className="den">{nextNext}</span>
            </span>
          );
          i += 3;
          continue;
        }

        nodes.push(
          <span className="token" key={`tok-${i}`}>
            {current}
          </span>
        );
        i += 1;
      }

      return nodes;
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="calculator" aria-label="IB MYP calculator">
      <div className="display" aria-live="polite">
        <div className="display-header">
          <span>IB MYP Calculator</span>
          <span className="badge">Angle: {angleMode}</span>
        </div>
        <div className="expression" aria-label="expression">
          {expression ? renderDisplay(expression) : '0'}
        </div>
        <div
          className={error ? 'error' : 'result'}
          aria-label={error ? 'error' : 'result'}
        >
          {error || (result ? `= ${result}` : ' ')}
        </div>
      </div>

      <div className="grid function-grid" aria-label="scientific keys">
        {functionButtons.map((button) => {
          const label =
            button.action === 'toggle-angle' ? angleMode : button.label;
          const classes = [
            'calc-btn',
            button.variant ?? '',
            button.span ? 'wide' : ''
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={`${button.label}-${label}`}
              type="button"
              className={classes}
              onClick={() => handleButton(button)}
              aria-label={
                button.action === 'toggle-angle'
                  ? `Switch angle mode (current ${angleMode})`
                  : button.label
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid main-grid" aria-label="primary keys">
        {mainButtons.map((button) => {
          const classes = [
            'calc-btn',
            button.variant ?? '',
            button.span ? 'wide' : ''
          ]
            .filter(Boolean)
            .join(' ');

          const labelNode =
            button.label === 'a/b' ? (
              <span className="fraction btn-fraction" aria-hidden="true">
                <span className="num">a</span>
                <span className="den">b</span>
              </span>
            ) : (
              button.label
            );

          return (
            <button
              key={button.label}
              type="button"
              className={classes}
              onClick={() => handleButton(button)}
              aria-label={button.label}
            >
              {labelNode}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calculator;

