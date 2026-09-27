import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Grow, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { formatCurrency } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';
import { cartKey, flatKey, type CollectedItemsCart } from '../hooks/useCollectedItemsCart';

interface CollectedItemsCardProps {
  cart: CollectedItemsCart;
  saving?: boolean;
  hideSaveButton?: boolean;
}

export function CollectedItemsCard({ cart, saving, hideSaveButton = false }: CollectedItemsCardProps) {
  const {
    itemizedEntries,
    addonEntries,
    totalQty,
    totalAmount,
    discountAmount,
    setDiscountAmount,
    totalAfterDiscount,
    priceFor,
    lineTotal,
    changeQuantity,
    setRemoveKey,
    removeKey,
    removeEntry,
    removeFromCart,
    dirty,
    confirmOpen,
    setConfirmOpen,
    handleConfirmSave,
  } = cart;

  return (
    <>
      <Card variant="outlined" sx={{ p: 2, width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            Collected Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalQty} item{totalQty === 1 ? '' : 's'}
          </Typography>
        </Stack>

        {itemizedEntries.length === 0 && addonEntries.length === 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            No items yet — pick a service tab, then tap a cloth type to add it.
          </Alert>
        )}

        {itemizedEntries.length > 0 && (
          <Box>
            <Stack spacing={0.75}>
              {itemizedEntries.map(([key, entry]) => {
                const price = priceFor(entry.clothType!, entry.service._id);
                return (
                  <Grow in key={key}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        py: 0.5,
                        px: 1,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Typography fontSize={20}>{getClothTypeIcon(entry.clothType!)}</Typography>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {entry.clothType!.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {entry.service.name} · {price !== undefined ? formatCurrency(price) : 'Price not set'}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0}>
                        <IconButton size="small" sx={{ p: 0.5 }} onClick={() => changeQuantity(key, -1)}>
                          <RemoveIcon fontSize="inherit" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 18, textAlign: 'center' }} fontWeight={700}>
                          {entry.quantity}
                        </Typography>
                        <IconButton size="small" sx={{ p: 0.5 }} onClick={() => changeQuantity(key, 1)}>
                          <AddIcon fontSize="inherit" />
                        </IconButton>
                      </Stack>
                      <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ minWidth: 56, textAlign: 'right' }}>
                        {formatCurrency(lineTotal(entry))}
                      </Typography>
                      <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setRemoveKey(key)}>
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    </Stack>
                  </Grow>
                );
              })}
            </Stack>
          </Box>
        )}

        {addonEntries.length > 0 && (
          <Box sx={{ mt: itemizedEntries.length > 0 ? 2 : 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
              Add-ons
            </Typography>
            <Stack spacing={0.75}>
              {addonEntries.map(([key, entry]) => (
                <Grow in key={key}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      py: 0.5,
                      px: 1,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Typography fontSize={20}>🏠</Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {entry.service.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Flat fee
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatCurrency(lineTotal(entry))}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.5 }} onClick={() => setRemoveKey(key)}>
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Grow>
              ))}
            </Stack>
          </Box>
        )}

        {totalAmount > 0 && (
          <Stack spacing={1} mt={2} pt={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Total Amount</Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(totalAmount)}
              </Typography>
            </Stack>
            <TextField
              label="Discount"
              type="number"
              size="small"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700}>
                Total After Discount
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {formatCurrency(totalAfterDiscount)}
              </Typography>
            </Stack>
          </Stack>
        )}

        {!hideSaveButton && (
          <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={!dirty || saving} onClick={() => setConfirmOpen(true)}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </Card>

      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Confirm {totalQty} item{totalQty === 1 ? '' : 's'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {[...itemizedEntries, ...addonEntries].map(([, e]) => (
              <Stack
                key={e.clothType ? cartKey(e.clothType._id, e.service._id) : flatKey(e.service._id)}
                direction="row"
                justifyContent="space-between"
                spacing={2}
                sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="body2">
                  {e.clothType ? `${e.clothType.name} · ${e.service.name} × ${e.quantity}` : e.service.name}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                  {formatCurrency(lineTotal(e))}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={2} pt={1} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700}>{formatCurrency(totalAmount)}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmSave} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeKey)}
        title="Remove this item?"
        description={
          removeEntry
            ? removeEntry.clothType
              ? `${removeEntry.clothType.name} · ${removeEntry.service.name} × ${removeEntry.quantity} will be removed from the list.`
              : `${removeEntry.service.name} will be removed from the list.`
            : undefined
        }
        confirmLabel="Remove"
        confirmColor="error"
        onConfirm={() => {
          if (removeKey) removeFromCart(removeKey);
          setRemoveKey(null);
        }}
        onClose={() => setRemoveKey(null)}
      />
    </>
  );
}
