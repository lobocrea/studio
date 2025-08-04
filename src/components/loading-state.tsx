import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-24 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-muted-foreground">{text}</p>
    </div>
  );
}
