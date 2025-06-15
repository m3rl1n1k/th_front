
"use client";

import React from 'react';
import {
  Shapes, Utensils, ShoppingCart, Car, Drama, Shirt, Home, Fuel, Pill, Gift,
  GraduationCap, Plane, Dumbbell, Film, Music, CircleDollarSign, BarChart2,
  MoreHorizontal, AlertCircle, Euro, PoundSterling, Landmark,
  Save, ArrowLeft, PlusCircle, Palette, Tag, LayoutGrid, List, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, HelpCircle, LayoutDashboard, ListChecks,
  UserCircle, Settings, Languages, Edit3, KeyRound, WalletCards,
  Search, X, Check, Trash2, Copy, ExternalLink, Upload, Download, Briefcase,
  CreditCard, PiggyBank, TrendingUp, TrendingDown, Building, Calendar, Clock,
  Mail, Phone, MapPin, FileText, Folder, Image, Star, Heart, Bell, Sun, Moon, Award,
  type LucideIcon
} from 'lucide-react';

interface IconRendererProps {
  iconName: string | null | undefined;
  className?: string;
  color?: string;
}

const iconMap: Record<string, LucideIcon> = {
  // Existing Icons
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
  DollarSign: CircleDollarSign, // Alias for convenience
  Euro,
  PoundSterling,
  Landmark,
  BarChart2,
  MoreHorizontal,
  AlertCircle,

  // Icons from project usage
  Save,
  ArrowLeft,
  PlusCircle,
  Palette,
  Tag,
  LayoutGrid,
  List,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  UserCircle,
  Settings,
  Languages,
  Edit3,
  KeyRound,
  WalletCards,

  // Additional common icons
  Search,
  X, // Close
  Check,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  Download,
  Briefcase,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Building,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  FileText, // Document
  Folder,
  Image,
  Star,
  Heart,
  Bell,
  Sun,
  Moon,
  Award,
};

export const iconMapKeys = Object.keys(iconMap).sort();

const DefaultIcon = Shapes; // Default icon if no match is found

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, className, color }) => {
  let IconComponent: LucideIcon = DefaultIcon;

  if (iconName) {
    // Attempt direct match
    if (iconMap[iconName]) {
      IconComponent = iconMap[iconName];
    } else {
      // Attempt match with first letter capitalized (common for API values like "home" vs. Lucide "Home")
      const capitalizedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
      if (iconMap[capitalizedIconName]) {
        IconComponent = iconMap[capitalizedIconName];
      }
      // Could add more sophisticated matching (e.g. kebab-case to PascalCase) if needed
    }
  }
  
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
