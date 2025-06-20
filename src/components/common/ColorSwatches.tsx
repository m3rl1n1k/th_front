
"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const predefinedColors = [
  // Soft neutrals & grays
  '#F3F4F6', '#D1D5DB', '#6B7280', '#374151',
  // Muted Reds/Pinks
  '#FECACA', '#F87171', '#FCA5A5',
  // Muted Oranges/Yellows
  '#FDE68A', '#FBBF24', '#FCD34D',
  // Muted Greens
  '#A7F3D0', '#34D399', '#6EE7B7',
  // Muted Blues
  '#BFDBFE', '#60A5FA', '#93C5FD',
  // Muted Purples/Indigos
  '#C4B5FD', '#A78BFA', '#DDD6FE',
  // Other muted tones
  '#FBCFE8', '#A5B4FC', '#7DD3FC',
];

interface ColorSwatchesProps {
  value: string | null | undefined;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className="grid grid-cols-7 gap-2 p-1 border rounded-md bg-muted/20 max-w-xs">
      {predefinedColors.map((color) => (
        <button
          type="button"
          key={color}
          onClick={() => !disabled && onChange(color)}
          className={cn(
            "w-full aspect-square rounded-md border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 flex items-center justify-center",
            value === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-transparent hover:border-muted-foreground/50',
            (color === '#FFFFFF' || color === '#F3F4F6') && 'border-input',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Color ${color}`}
          disabled={disabled}
        >
          {value === color && (
            <Check
              className={cn(
                "h-3.5 w-3.5",
                (color === '#FFFFFF' || color === '#F3F4F6') ? 'text-gray-700' : 'text-primary-foreground mix-blend-difference'
              )}
            />
          )}
        </button>
      ))}
    </div>
  );
};
