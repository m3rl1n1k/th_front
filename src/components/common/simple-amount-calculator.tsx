
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/i18n-context';
import { cn } from '@/lib/utils';

interface SimpleAmountCalculatorProps {
  onApply: (value: number) => void;
  onClose: () => void;
  initialValue?: number | string;
}

export const SimpleAmountCalculator: React.FC<SimpleAmountCalculatorProps> = ({ onApply, onClose, initialValue }) => {
  const { t } = useTranslation();
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [currentOperand, setCurrentOperand] = useState<string | null>(null);
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isAwaitingNextOperand, setIsAwaitingNextOperand] = useState<boolean>(false);

  useEffect(() => {
    if (initialValue !== undefined) {
      const valStr = String(initialValue);
      if (!isNaN(parseFloat(valStr))) {
        setDisplayValue(valStr);
        setCurrentOperand(valStr);
      } else {
        setDisplayValue("0");
      }
    }
  }, [initialValue]);


  const inputDigit = (digit: string) => {
    if (isAwaitingNextOperand) {
      setDisplayValue(digit);
      setCurrentOperand(digit);
      setIsAwaitingNextOperand(false);
    } else {
      const newDisplayValue = displayValue === "0" ? digit : displayValue + digit;
      if (newDisplayValue.length <= 15) { // Limit input length
        setDisplayValue(newDisplayValue);
        setCurrentOperand(newDisplayValue);
      }
    }
  };

  const inputDecimal = () => {
    if (isAwaitingNextOperand) {
      setDisplayValue("0.");
      setCurrentOperand("0.");
      setIsAwaitingNextOperand(false);
      return;
    }
    if (!displayValue.includes(".")) {
      const newDisplayValue = displayValue + ".";
       if (newDisplayValue.length <= 15) {
        setDisplayValue(newDisplayValue);
        setCurrentOperand(newDisplayValue);
      }
    }
  };

  const performOperation = (op: string) => {
    const inputValue = parseFloat(currentOperand || displayValue);

    if (operator && previousOperand !== null && !isAwaitingNextOperand) {
      const prevValue = parseFloat(previousOperand);
      let result: number | string = 0;

      switch (operator) {
        case '+': result = prevValue + inputValue; break;
        case '-': result = prevValue - inputValue; break;
        case '*': result = prevValue * inputValue; break;
        case '/':
          if (inputValue === 0) {
            result = t('calculator.error.divByZero');
          } else {
            result = prevValue / inputValue;
          }
          break;
        default: return;
      }
      
      if (typeof result === 'number') {
        const resultStr = String(parseFloat(result.toFixed(10))); // Keep precision, remove trailing zeros
        setDisplayValue(resultStr);
        setPreviousOperand(resultStr);
        setCurrentOperand(resultStr); // Allow chaining operations on the result
      } else { // Error string
        setDisplayValue(result);
        setPreviousOperand(null);
        setCurrentOperand(null); // Reset operands on error
      }

    } else {
      setPreviousOperand(String(inputValue));
    }
    setIsAwaitingNextOperand(true);
    setOperator(op);
  };

  const handleEquals = () => {
    if (!operator || previousOperand === null || currentOperand === null || isAwaitingNextOperand) return;

    const prevValue = parseFloat(previousOperand);
    const currentValue = parseFloat(currentOperand);
    let result: number | string = 0;

    switch (operator) {
      case '+': result = prevValue + currentValue; break;
      case '-': result = prevValue - currentValue; break;
      case '*': result = prevValue * currentValue; break;
      case '/':
        if (currentValue === 0) {
          result = t('calculator.error.divByZero');
        } else {
          result = prevValue / currentValue;
        }
        break;
      default: return;
    }
    
    if (typeof result === 'number') {
        const resultStr = String(parseFloat(result.toFixed(10)));
        setDisplayValue(resultStr);
        setCurrentOperand(resultStr); 
    } else {
        setDisplayValue(result);
        setCurrentOperand(null);
    }
    setPreviousOperand(null);
    setOperator(null);
    setIsAwaitingNextOperand(false); 
  };

  const clearDisplay = () => {
    setDisplayValue("0");
    setCurrentOperand("0");
    setPreviousOperand(null);
    setOperator(null);
    setIsAwaitingNextOperand(false);
  };
  
  const handleApply = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      onApply(value);
      onClose();
    } else {
      // Handle error display or toast if needed, for now just don't apply
      setDisplayValue(t('calculator.error.invalidFormat'))
    }
  };

  const buttons = [
    { label: '7', action: () => inputDigit('7') }, { label: '8', action: () => inputDigit('8') }, { label: '9', action: () => inputDigit('9') }, { label: '/', action: () => performOperation('/'), variant: 'outline' as const },
    { label: '4', action: () => inputDigit('4') }, { label: '5', action: () => inputDigit('5') }, { label: '6', action: () => inputDigit('6') }, { label: '*', action: () => performOperation('*'), variant: 'outline' as const },
    { label: '1', action: () => inputDigit('1') }, { label: '2', action: () => inputDigit('2') }, { label: '3', action: () => inputDigit('3') }, { label: '-', action: () => performOperation('-'), variant: 'outline' as const },
    { label: '0', action: () => inputDigit('0') }, { label: '.', action: inputDecimal }, { label: '=', action: handleEquals, variant: 'secondary' as const }, { label: '+', action: () => performOperation('+'), variant: 'outline' as const },
  ];

  return (
    <div className="w-64 p-2 space-y-2 bg-popover shadow-md rounded-lg border" onClick={(e) => e.stopPropagation()}>
      <Input
        type="text"
        value={displayValue}
        readOnly
        className="w-full text-right h-12 text-2xl font-mono bg-muted/50 dark:bg-muted/20 border-border"
        aria-label={t('calculator.displayLabel')}
      />
      <div className="grid grid-cols-4 gap-1">
        <Button onClick={clearDisplay} className="col-span-2 h-12 text-lg" variant="destructive">
          {t('calculator.clear')}
        </Button>
        <Button onClick={handleApply} className="col-span-2 h-12 text-lg" variant="default">
          {t('calculator.apply')}
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {buttons.map((btn, index) => (
          <Button
            key={index}
            onClick={btn.action}
            variant={btn.variant || "outline"}
            className={cn("h-12 text-lg", btn.label === '=' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '')}
            aria-label={btn.label === '=' ? t('calculator.equals') : btn.label === '.' ? t('calculator.decimal') : `${t('calculator.operator', { op: btn.label}) || t('calculator.digit', { num: btn.label })}`}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
