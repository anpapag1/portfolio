import { PortfolioContent } from '../types/content';
import { parseContent, getDefaultContent } from './contentSchema';

export async function loadContent(): Promise<PortfolioContent> {
  try {
    const res = await fetch('./content/content.json');
    if (!res.ok) {
      return getDefaultContent();
    }
    const json = await res.json();
    return parseContent(json);
  } catch {
    return getDefaultContent();
  }
}
