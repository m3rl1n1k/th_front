
// Curated list of lucide-react icon names for selection

export const walletIconNames = [
  'Wallet',
  'Landmark',
  'CreditCard',
  'DollarSign',
  'PiggyBank',
  'Briefcase',
  'Euro',
  'Bitcoin',
  'CircleDollarSign',
  'SmartphoneNfc', // Changed from Smartphone to SmartphoneNfc for better visual
  'ShieldCheck',
  'Building',
] as const;

export type WalletIconName = typeof walletIconNames[number];

export const categoryIconNames = [
  'ShoppingCart',
  'Utensils',
  'Car',
  'Home',
  'Film',
  'Gift',
  'BookOpen',
  'Plane',
  'Heart',
  'Briefcase',
  'GraduationCap',
  'Sparkles',
  'ShoppingBag',
  'Shirt',
  'Ticket',
  'Bus',
  'Fuel',
  'Lightbulb',
  'Wifi',
  'Coffee',
  'Bone', // For pets
  'PawPrint', // For pets
  'Pizza', // For food
  'Music',
  'Palette', // For hobbies/arts
  'Bike', // For transport/sport
  'Train',
  'TreeDeciduous', // For nature/parks
  'Waves', // For travel/beach
  'Baby', // For kids
  'Dumbbell', // For fitness
  'MonitorSmartphone', // For electronics
  'Gamepad2', // For gaming
  'HelpingHand', // For charity
  'Recycle', // For utilities/environment
] as const;

export type CategoryIconName = typeof categoryIconNames[number];
