export interface LinkItem {
  label: string;
  url: string;
  copy?: string;
}

export interface ImageRef {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface TerminalData {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  lines: string[];
  links?: LinkItem[];
  images?: ImageRef[];
  typewriterSpeed?: number;
}

export interface PortfolioContent {
  terminals: TerminalData[];
}
