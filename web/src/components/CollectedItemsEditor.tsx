import { Stack } from '@mui/material';
import { useCollectedItemsCart } from '../hooks/useCollectedItemsCart';
import { CollectedItemsCard } from './CollectedItemsCard';
import { AddItemsCard } from './AddItemsCard';
import type { CollectedItem } from '../types';

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onSave: (items: { clothType?: string; service: string; quantity: number }[]) => void | Promise<void>;
  saving?: boolean;
  onChange?: (items: { clothType?: string; service: string; quantity: number }[]) => void;
  hideSaveButton?: boolean;
}

export function CollectedItemsEditor({ items, onSave, saving, onChange, hideSaveButton = false }: CollectedItemsEditorProps) {
  const cart = useCollectedItemsCart({ items, onSave, onChange });

  return (
    <Stack spacing={4} alignItems="flex-start">
      <CollectedItemsCard cart={cart} saving={saving} hideSaveButton={hideSaveButton} />
      <AddItemsCard cart={cart} />
    </Stack>
  );
}
