const ICON_MAP: Record<string, string> = {
  Shirt: '👔',
  'T-Shirt': '👕',
  Pant: '👖',
  Jeans: '👖',
  Shorts: '🩳',
  Saree: '🥻',
  Blazer: '🧥',
  Coat: '🧥',
  Suit: '🧥',
  Kurta: '👘',
  Blanket: '🛏️',
  Bedsheet: '🛏️',
  Curtain: '🪟',
  'Pillow Cover': '🛏️',
  Shoes: '👟',
  Others: '🧺',
};

const DEFAULT_ICON = '🧺';

export function getClothTypeIcon(name: string): string {
  return ICON_MAP[name] ?? DEFAULT_ICON;
}
