
import { Loader2 } from 'lucide-react';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex items-center justify-center fixed inset-0 bg-background/80 z-50">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
