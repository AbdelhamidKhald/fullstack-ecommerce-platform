import { type ReactNode } from 'react';
import { useAnimateOnScroll } from '../../hooks/useAnimateOnScroll';
import { cn } from '../../lib/utils';

type Animation = 'fade-in' | 'fade-in-up' | 'fade-in-down' | 'slide-in-left' | 'slide-in-right' | 'scale-in';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: Animation;
  delay?: string;
  className?: string;
  threshold?: number;
}

export function AnimatedSection({
  children,
  animation = 'fade-in-up',
  delay,
  className,
  threshold = 0.1,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useAnimateOnScroll<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={cn(
        'opacity-0',
        isVisible && `animate-${animation}`,
        delay,
        className
      )}
    >
      {children}
    </div>
  );
}
