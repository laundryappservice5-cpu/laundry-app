const ICON_MAP: Record<string, string> = {
  'Dry Cleaning': '🧥',
  'Dry Wash': '🫧',
  Press: '👔',
  'House Cleaning': '🏠',
};

const DEFAULT_ICON = '🧺';

export function getServiceIcon(name: string): string {
  return ICON_MAP[name] ?? DEFAULT_ICON;
}
