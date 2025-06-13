
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

// Define a type for all possible Lucide icon names
// This is a bit manual but ensures type safety if LucideIcons doesn't export a ready-made union type
type LucideIconName = keyof typeof LucideIcons;

interface DynamicIconProps extends LucideIcons.LucideProps {
  name?: LucideIconName | string; // Allow string for flexibility, but prefer LucideIconName
  fallback?: React.ElementType; // A fallback Lucide icon component
}

export function DynamicIcon({ name, fallback: FallbackIcon, ...props }: DynamicIconProps) {
  if (!name || !(name in LucideIcons)) {
    if (FallbackIcon) {
      return <FallbackIcon {...props} />;
    }
    return null; // Or a default generic icon, or nothing
  }

  const IconComponent = LucideIcons[name as LucideIconName] as React.ElementType;

  if (!IconComponent) {
     if (FallbackIcon) {
      return <FallbackIcon {...props} />;
    }
    return null;
  }

  return <IconComponent {...props} />;
}
