
"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// New palette based on provided Tailwind CSS colors
export const predefinedColors = [
  // Reds & Pinks
  '#ef4444', // RED_500
  '#F43F5E', // ROSE_500
  '#EC4899', // PINK_500
  '#D10094', // FUCHSIA_500

  // Oranges & Yellows
  '#f59e0b', // ORANGE_500
  '#fbbf24', // AMBER_400 (Original AMBER_500 was #f59e0b)
  '#fcd34d', // YELLOW_300 (Original YELLOW_500 was #f59e0b)

  // Greens & Limes
  '#84cc16', // LIME_500
  '#10b981', // GREEN_500
  '#059669', // EMERALD_600 (Original EMERALD_500 was #10b981)
  '#14b8a6', // TEAL_500

  // Blues & Cyans
  '#06b6d4', // CYAN_500
  '#0ea5e9', // SKY_500
  '#3b82f6', // BLUE_500
  '#4F46E5', // INDIGO_500

  // Purples
  '#7C3AED', // PURPLE_500
  '#9333EA', // VIOLET_500

  // Grays & Neutrals
  '#64748B', // SLATE_500
  '#6B7280', // GRAY_500
  '#A3A3A2', // NEUTRAL_400 (Original NEUTRAL_500 was #737373)
  '#737373', // ZINC_500
  '#A38F80', // STONE_500

  // Black & White
  '#000000', // BLACK
  '#FFFFFF', // WHITE
];


interface ColorSwatchesProps {
  value: string | null | undefined;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className={cn(
      "grid gap-1 p-0.5 border rounded-md bg-muted/20 max-w-xs",
      "grid-cols-5", // Default to 5 columns (mobile-first)
      "sm:grid-cols-7 sm:gap-2 sm:p-1" // For 'sm' breakpoint (640px) and up, use 7 columns and larger gaps/padding
    )}>
      {predefinedColors.map((color) => (
        <button
          type="button"
          key={color}
          onClick={() => !disabled && onChange(color)}
          className={cn(
            "w-full aspect-square rounded-md border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 flex items-center justify-center",
            value === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-transparent hover:border-muted-foreground/50',
            (color === '#FFFFFF' || color.toUpperCase() === '#F3F4F6') && 'border-input', // Explicit border for very light colors
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
                (color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#F3F4F6') ? 'text-gray-700' : 'text-primary-foreground mix-blend-difference'
              )}
            />
          )}
        </button>
      ))}
    </div>
  );
};
