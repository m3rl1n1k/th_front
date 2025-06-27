
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

function hexToHsl(hex: string): string | null {
  if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return null;
  }
  let hexVal = hex.substring(1);
  if (hexVal.length === 3) {
    hexVal = hexVal.split('').map(char => char + char).join('');
  }

  const r = parseInt(hexVal.substring(0, 2), 16) / 255;
  const g = parseInt(hexVal.substring(2, 4), 16) / 255;
  const b = parseInt(hexVal.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }
    h /= 6;
  }

  return `${(h * 360).toFixed(1)} ${s > 0 ? (s * 100).toFixed(1) + '%' : '0%'} ${(l * 100).toFixed(1)}%`;
}

export function DynamicStyles() {
  const { user } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (user?.settings) {
      const { primary_color, accent_color } = user.settings;

      if (primary_color) {
        const primaryHsl = hexToHsl(primary_color);
        if (primaryHsl) {
          root.style.setProperty('--primary', primaryHsl);
        }
      }
      if (accent_color) {
        const accentHsl = hexToHsl(accent_color);
        if (accentHsl) {
          root.style.setProperty('--accent', accentHsl);
        }
      }
    }
  }, [user]);

  return null;
}
