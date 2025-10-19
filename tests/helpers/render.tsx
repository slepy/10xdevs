import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

/**
 * Custom render function that wraps components with necessary providers
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <>{children}</>,
    ...options,
  });
}

export * from "@testing-library/react";
export { render };
