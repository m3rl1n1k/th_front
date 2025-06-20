
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
  '#f59e0b', // ORANGE_500 (also AMBER_500, YELLOW_500)
  '#fbbf24', // AMBER_400 (also ORANGE_400, YELLOW_400)
  '#fcd34d', // YELLOW_300 (also ORANGE_300, AMBER_300)

  // Greens & Limes
  '#84cc16', // LIME_500
  '#10b981', // GREEN_500 (also EMERALD_500)
  '#059669', // EMERALD_600 (also GREEN_600)
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
  '#737373', // ZINC_500 (also NEUTRAL_500)
  '#A38F80', // STONE_500

  // Black & White
  '#000000', // BLACK
  '#FFFFFF', // WHITE
  '#F3F4F6', // GRAY_100 (A light gray for more options)
];


interface ColorSwatchesProps {
  value: string | null | undefined;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className={cn(
      "grid gap-1 p-0.5 w-full", // Removed: border, rounded-md, bg-muted/20, max-w-xs. Added: w-full
      "grid-cols-5", 
      "sm:grid-cols-7 sm:gap-2 sm:p-1" 
    )}>
      {predefinedColors.map((color) => (
        <button
          type="button"
          key={color}
          onClick={() => !disabled && onChange(color)}
          className={cn(
            "w-full aspect-square rounded-md border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 flex items-center justify-center",
            value === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-transparent hover:border-muted-foreground/50',
            (color === '#FFFFFF' || color.toUpperCase() === '#F3F4F6') && 'border-input', 
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
