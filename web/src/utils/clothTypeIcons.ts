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

// A curated set of icons admins can pick from for any cloth type — covers garments,
// footwear, household linens, and general laundry/sewing symbols.
export const CLOTH_ICON_LIBRARY = [
  '👔', '👕', '👖', '🩳', '👗', '👚', '🥻', '👘', '🧥', '🦺',
  '🧣', '🧤', '🧦', '👙', '🩱', '🎩', '🧢', '👞', '👟', '👠',
  '👡', '🥿', '🥾', '🛏️', '🪟', '🧻', '🛁', '🧶', '🪢', '🧵',
  '👜', '🎒', '🧳', '🧺', '🧕', '🎽', '🪡', '🧼', '🫧', '🚿',
];

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
