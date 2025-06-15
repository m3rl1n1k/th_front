
"use client";

import React from 'react';
import {
  Shapes, Utensils, ShoppingCart, Car, Drama, Shirt, Home, Fuel, Pill, Gift,
  GraduationCap, Plane, Dumbbell, Film, Music, CircleDollarSign, BarChart2,
  MoreHorizontal, AlertCircle, type LucideIcon, Euro, PoundSterling, Landmark
} from 'lucide-react';

interface IconRendererProps {
  iconName: string | null | undefined;
  className?: string;
  color?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Shapes,
  Utensils,
  ShoppingCart,
  Car,
  Drama,
  Shirt,
  Home,
  Fuel,
  Pill,
  Gift,
  GraduationCap,
  Plane,
  Dumbbell,
  Film,
  Music,
  CircleDollarSign,
  DollarSign: CircleDollarSign, // Alias
  Euro,
  PoundSterling,
  Landmark,
  BarChart2,
  MoreHorizontal,
  AlertCircle,
  // Add more icons as needed from lucide-react
};

const DefaultIcon = Shapes;

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className, color }) => {
  const IconComponent = iconName ? (iconMap[iconName] || iconMap[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || DefaultIcon) : DefaultIcon;
  
  return <IconComponent className={cn("h-5 w-5", className)} style={color ? { color } : {}} />;
};

// Helper for cn if not already available globally in your project
// You can move this to a utils file if you prefer
const cn = (...inputs: Array<string | undefined | null | false | Record<string, boolean>>): string => {
  return inputs
    .reduce((acc: string[], val) => {
      if (typeof val === 'string') {
        return acc.concat(val.split(' '));
      } else if (typeof val === 'object' && val !== null) {
        Object.entries(val).forEach(([key, value]) => {
          if (value) {
            acc.push(key);
          }
        });
      }
      return acc;
    }, [])
    .filter(Boolean)
    .join(' ');
};
