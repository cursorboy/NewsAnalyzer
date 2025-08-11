/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "react-dom/client" {
  import { Container } from "react-dom";
  export function createRoot(container: Container): {
    render(element: React.ReactElement): void;
    unmount(): void;
  };
}
