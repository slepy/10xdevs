import type { ReactNode } from "react";

interface BaseHeaderProps {
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * BaseHeader component displays a page title with optional action buttons
 * React version of BaseHeader.astro for use in client-side components
 */
export function BaseHeader({ title, actions, children }: BaseHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {(actions || children) && <div className="flex gap-2">{actions || children}</div>}
    </div>
  );
}
