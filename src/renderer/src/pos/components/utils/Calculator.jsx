// Calculator.jsx
// Standalone calculator modal, opened from Header's Cal button.
// Internal state (display, memory, pending operation) lives here — it's
// ephemeral widget state, not POS business state, same precedent as
// SearchableFilterSelect's internal open/query state in ProductPannel.jsx.

import { useState, useRef, useEffect, useCallback } from "react";

// ── PRECISE DECIMAL ARITHMETIC ──
// Plain JS floats break on things like 0.1 + 0.2 === 0.30000000000000004.
// For a POS calculator that's not acceptable, so every op scales operands
// to integers first (based on how many decimal places are actually present),
// computes on integers, then scales back — giving exact decimal results for
// every input a cashier will realistically type.
const countDecimals = (num) => {
  if (!isFinite(num) || Math.floor(num) === num) return 0;
  const str = num.toString();
  if (str.includes('e-')) {
    const [mantissa, exp] = str.split('e-');
    return parseInt(exp, 10) + (mantissa.split('.')[1]?.length || 0);
  }
  return str.split('.')[1]?.length || 0;
};

const preciseAdd = (a, b) => {
  const factor = Math.pow(10, Math.max(countDecimals(a), countDecimals(b)));
  return (Math.round(a * factor) + Math.round(b * factor)) / factor;
};

const preciseSubtract = (a, b) => {
  const factor = Math.pow(10, Math.max(countDecimals(a), countDecimals(b)));
  return (Math.round(a * factor) - Math.round(b * factor)) / factor;
};

const preciseMultiply = (a, b) => {
  const da = countDecimals(a);
  const db = countDecimals(b);
  const intA = Math.round(a * Math.pow(10, da));
  const intB = Math.round(b * Math.pow(10, db));
  return (intA * intB) / Math.pow(10, da + db);
};

const preciseDivide = (a, b) => {
  if (b === 0) return null; // caller must handle — never silently return Infinity/NaN
  const da = countDecimals(a);
  const db = countDecimals(b);
  const intA = Math.round(a * Math.pow(10, da));
  const intB = Math.round(b * Math.pow(10, db));
  return (intA * Math.pow(10, db)) / (intB * Math.pow(10, da));
};

const calculate = (a, b, op) => {
  switch (op) {
    case '+': return preciseAdd(a, b);
    case '−': return preciseSubtract(a, b);
    case '×': return preciseMultiply(a, b);
    case '÷': return preciseDivide(a, b);
    default: return b;
  }
};

// Kills residual float noise beyond a sane display precision (e.g. 1÷3),
// and falls back to exponential notation for numbers too large/small to
// show plainly — same behaviour as a real calculator.
const cleanNumber = (num) => {
  if (!isFinite(num)) return null;
  const rounded = parseFloat(num.toPrecision(12));
  return rounded;
};

const MAX_DIGITS = 15;

// ── DISPLAY FORMATTING ──
// Adds thousand separators to the integer part while typing, without
// touching a trailing "." or trailing zeros the cashier is mid-typing.
const formatDisplay = (rawStr) => {
  if (rawStr === 'Error') return 'Error';
  const isNegative = rawStr.startsWith('-');
  const unsigned = isNegative ? rawStr.slice(1) : rawStr;
  const [intPart, decPart] = unsigned.split('.');
  const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const withDecimal = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return (isNegative ? '-' : '') + withDecimal;
};

const formatNumber = (num) => {
  if (num === null) return '';
  const cleaned = cleanNumber(num);
  return formatDisplay(String(cleaned));
};

const CalcButton = ({ label, onClick, variant = "default", className = "" }) => {
  const base = "h-14 rounded-xl text-lg font-medium transition-colors active:scale-95";
  const variants = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    operator: "bg-[#e6f4f6] text-[#1a6b7a] hover:bg-[#d3edf0] font-semibold",
    action: "bg-slate-200 text-slate-600 hover:bg-slate-300",
    equals: "bg-[#1a6b7a] text-white hover:bg-[#155764] font-semibold",
    memory: "bg-white border border-slate-300 text-slate-500 text-xs font-medium hover:bg-slate-50 h-9",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {label}
    </button>
  );
};

const Calculator = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState(false);
  const [memory, setMemory] = useState(0);

  const containerRef = useRef(null);

  const resetAll = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(false);
    setError(false);
  }, []);

  // Reset to a clean slate every time the calculator is opened, so it never
  // shows a stale result from the cashier's last unrelated calculation.
  useEffect(() => {
    if (isOpen) resetAll();
  }, [isOpen, resetAll]);

  // Click-outside-to-close — same pattern as SearchableFilterSelect.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const inputDigit = useCallback((digit) => {
    if (error) {
      setError(false);
      setDisplay(digit);
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    if (waitingForOperand || justEvaluated) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    setDisplay((prev) => {
      const digitsOnly = prev.replace(/[-.]/g, '');
      if (digitsOnly.length >= MAX_DIGITS) return prev;
      return prev === '0' ? digit : prev + digit;
    });
  }, [error, waitingForOperand, justEvaluated]);

  const inputDecimal = useCallback(() => {
    if (error) {
      setError(false);
      setDisplay('0.');
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    if (waitingForOperand || justEvaluated) {
      setDisplay('0.');
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    setDisplay((prev) => (prev.includes('.') ? prev : prev + '.'));
  }, [error, waitingForOperand, justEvaluated]);

  const backspace = useCallback(() => {
    if (error || waitingForOperand || justEvaluated) return;
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }, [error, waitingForOperand, justEvaluated]);

  const clearEntry = useCallback(() => {
    setError(false);
    setDisplay('0');
  }, []);

  const toggleSign = useCallback(() => {
    if (error) return;
    setDisplay((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, [error]);

  // POS-relevant percent behaviour: mid-operation (e.g. price × 10 %),
  // treats the entered number as a percentage OF the previous value —
  // exactly how a cashier expects a discount to work. Standalone, it's a
  // plain ÷100.
  const inputPercent = useCallback(() => {
    if (error) return;
    const current = Number(display);
    if (operator && previousValue !== null) {
      const pct = preciseDivide(current, 100);
      const result = preciseMultiply(previousValue, pct);
      setDisplay(String(cleanNumber(result)));
    } else {
      const result = preciseDivide(current, 100);
      setDisplay(String(cleanNumber(result)));
    }
  }, [error, display, operator, previousValue]);

  const performOperation = useCallback((nextOperator) => {
    if (error) return;
    const inputValue = Number(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(`${formatNumber(inputValue)} ${nextOperator}`);
    } else if (operator && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operator);
      if (result === null) {
        setError(true);
        setDisplay('Error');
        setExpression('');
        setPreviousValue(null);
        setOperator(null);
        return;
      }
      const cleaned = cleanNumber(result);
      setPreviousValue(cleaned);
      setDisplay(String(cleaned));
      setExpression(`${formatNumber(cleaned)} ${nextOperator}`);
    } else {
      // Operator pressed again before typing a new operand — just swap it.
      setExpression(`${formatNumber(previousValue)} ${nextOperator}`);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
    setJustEvaluated(false);
  }, [error, display, previousValue, operator, waitingForOperand]);

  const equals = useCallback(() => {
    if (error || operator === null || previousValue === null) return;
    const inputValue = Number(display);
    const result = calculate(previousValue, inputValue, operator);

    if (result === null) {
      setError(true);
      setDisplay('Error');
      setExpression('Cannot divide by zero');
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }

    const cleaned = cleanNumber(result);
    setExpression(`${formatNumber(previousValue)} ${operator} ${formatNumber(inputValue)} =`);
    setDisplay(String(cleaned));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  }, [error, operator, previousValue, display]);

  // ── Memory ──
  const memoryAdd = useCallback(() => {
    if (error) return;
    setMemory((prev) => preciseAdd(prev, Number(display)));
    setJustEvaluated(true);
  }, [error, display]);

  const memorySubtract = useCallback(() => {
    if (error) return;
    setMemory((prev) => preciseSubtract(prev, Number(display)));
    setJustEvaluated(true);
  }, [error, display]);

  const memoryRecall = useCallback(() => {
    setError(false);
    setDisplay(String(cleanNumber(memory)));
    setWaitingForOperand(false);
    setJustEvaluated(false);
  }, [memory]);

  const memoryClear = useCallback(() => setMemory(0), []);

  // ── Keyboard support ──
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) { inputDigit(e.key); return; }
      switch (e.key) {
        case '.': inputDecimal(); break;
        case '+': performOperation('+'); break;
        case '-': performOperation('−'); break;
        case '*': performOperation('×'); break;
        case '/': e.preventDefault(); performOperation('÷'); break;
        case '%': inputPercent(); break;
        case 'Enter': case '=': equals(); break;
        case 'Backspace': backspace(); break;
        case 'Escape': onClose(); break;
        case 'Delete': clearEntry(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputDigit, inputDecimal, performOperation, inputPercent, equals, backspace, clearEntry, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#1a6b7a] px-4 py-3">
          <span className="text-white text-sm font-medium">Calculator</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="Close calculator"
          >
            ×
          </button>
        </div>

        {/* Memory row */}
        <div className="flex items-center gap-1.5 px-3 pt-3">
          <CalcButton label="MC" variant="memory" onClick={memoryClear} className="flex-1" />
          <CalcButton label="MR" variant="memory" onClick={memoryRecall} className="flex-1" />
          <CalcButton label="M+" variant="memory" onClick={memoryAdd} className="flex-1" />
          <CalcButton label="M−" variant="memory" onClick={memorySubtract} className="flex-1" />
          {memory !== 0 && (
            <span className="text-[10px] text-[#1a6b7a] font-semibold shrink-0 pl-0.5">M</span>
          )}
        </div>

        {/* Display */}
        <div className="px-4 pt-3 pb-4">
          <div className="h-5 text-right text-xs text-slate-400 truncate">
            {expression}
          </div>
          <div
            className={`text-right font-semibold truncate ${
              error ? 'text-red-500 text-2xl' : 'text-slate-800 text-4xl'
            }`}
          >
            {error ? 'Error' : formatDisplay(display)}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 p-3 pt-0">
          <CalcButton label="C" variant="action" onClick={resetAll} />
          <CalcButton label="CE" variant="action" onClick={clearEntry} />
          <CalcButton label="%" variant="action" onClick={inputPercent} />
          <CalcButton label="÷" variant="operator" onClick={() => performOperation('÷')} />

          <CalcButton label="7" onClick={() => inputDigit('7')} />
          <CalcButton label="8" onClick={() => inputDigit('8')} />
          <CalcButton label="9" onClick={() => inputDigit('9')} />
          <CalcButton label="×" variant="operator" onClick={() => performOperation('×')} />

          <CalcButton label="4" onClick={() => inputDigit('4')} />
          <CalcButton label="5" onClick={() => inputDigit('5')} />
          <CalcButton label="6" onClick={() => inputDigit('6')} />
          <CalcButton label="−" variant="operator" onClick={() => performOperation('−')} />

          <CalcButton label="1" onClick={() => inputDigit('1')} />
          <CalcButton label="2" onClick={() => inputDigit('2')} />
          <CalcButton label="3" onClick={() => inputDigit('3')} />
          <CalcButton label="+" variant="operator" onClick={() => performOperation('+')} />

          <CalcButton label="+/−" onClick={toggleSign} />
          <CalcButton label="0" onClick={() => inputDigit('0')} />
          <CalcButton label="⌫" onClick={backspace} />
          <CalcButton label="=" variant="equals" onClick={equals} />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
