const ICON_MAP: Record<string, string> = {
  Shirt: '👔',
  'T-Shirt': '👕',
  Pant: '👖',
  Jeans: '👖',
  Shorts: '🩳',
  Saree: '🥻',
  Sari: '🥻',
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

interface IconSource {
  name: string;
  icon?: string;
}

export function getClothTypeIcon(clothType: IconSource | string): string {
  if (typeof clothType === 'string') {
    return ICON_MAP[clothType] ?? DEFAULT_ICON;
  }
  return clothType.icon || ICON_MAP[clothType.name] || DEFAULT_ICON;
}
