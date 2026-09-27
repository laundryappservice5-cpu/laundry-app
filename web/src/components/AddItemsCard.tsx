import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { formatCurrency } from '../utils/formatters';
import { ALL_TAB, cartKey, type CollectedItemsCart } from '../hooks/useCollectedItemsCart';

interface AddItemsCardProps {
  cart: CollectedItemsCart;
  width?: string | { xs?: string; md?: string };
}

export function AddItemsCard({ cart, width = { xs: '100%', md: '70%' } }: AddItemsCardProps) {
  const {
    services,
    itemizedServices,
    activeService,
    setActiveService,
    search,
    setSearch,
    filteredTypes,
    priceFor,
    addToCart,
    addFlatFeeToCart,
    activeServiceDoc,
    isFlatFeeActive,
    cart: cartMap,
    addTypeOpen,
    setAddTypeOpen,
    newTypeName,
    setNewTypeName,
    isCreatingType,
    handleCreateType,
  } = cart;

  return (
    <Box sx={{ width }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        Add Items
      </Typography>
      <Card variant="outlined" sx={{ p: 2 }}>
        <Tabs
          value={activeService === ALL_TAB || services.some((s) => s._id === activeService) ? activeService : false}
          onChange={(_, v) => setActiveService(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
        >
          {services.map((svc) => {
            const isFlat = svc.flatPrice != null;
            return (
              <Tab
                key={svc._id}
                label={isFlat ? `🏠 ${svc.name}` : svc.name}
                value={svc._id}
                sx={{ minHeight: 40 }}
              />
            );
          })}
          <Tab key={ALL_TAB} label="All" value={ALL_TAB} sx={{ minHeight: 40 }} />
        </Tabs>

        {isFlatFeeActive && activeServiceDoc ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <Typography fontSize={40}>🏠</Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {activeServiceDoc.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              An addon — no items needed. Adding it charges one flat amount alongside anything else already in the cart.
            </Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              {formatCurrency(activeServiceDoc.flatPrice ?? 0)}
            </Typography>
            <Button variant="contained" onClick={() => addFlatFeeToCart(activeServiceDoc)}>
              {cartMap.has(`flat::${activeServiceDoc._id}`) ? 'Added' : `Add ${activeServiceDoc.name}`}
            </Button>
          </Stack>
        ) : (
          <>
            <TextField
              placeholder="Search cloth types…"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={1.5}>
              {filteredTypes.map((ct) => {
                const isAll = activeService === ALL_TAB;

                if (isAll) {
                  const pricedServices = itemizedServices.filter((svc) => priceFor(ct, svc._id) !== undefined);
                  const totalQtyForType = [...cartMap.values()]
                    .filter((e) => e.clothType?._id === ct._id)
                    .reduce((sum, e) => sum + e.quantity, 0);
                  return (
                    <Grid key={ct._id} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                      <Card variant="outlined" sx={{ p: 1.5, position: 'relative' }}>
                        {totalQtyForType > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {totalQtyForType}
                          </Box>
                        )}
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography fontSize={24}>{getClothTypeIcon(ct)}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {ct.name}
                          </Typography>
                        </Stack>
                        {pricedServices.length === 0 ? (
                          <Typography variant="caption" color="text.disabled">
                            No prices set
                          </Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            {pricedServices.map((svc) => {
                              const price = priceFor(ct, svc._id)!;
                              const qty = cartMap.get(cartKey(ct._id, svc._id))?.quantity ?? 0;
                              return (
                                <Stack
                                  key={svc._id}
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  onClick={() => addToCart(ct, svc)}
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    bgcolor: qty > 0 ? 'action.selected' : 'action.hover',
                                    '&:hover': { bgcolor: 'action.selected' },
                                  }}
                                >
                                  <Typography variant="caption">{svc.name}</Typography>
                                  <Typography variant="caption" fontWeight={700} color="primary.main">
                                    {formatCurrency(price)}
                                    {qty > 0 ? ` ×${qty}` : ''}
                                  </Typography>
                                </Stack>
                              );
                            })}
                          </Stack>
                        )}
                      </Card>
                    </Grid>
                  );
                }

                const key = activeService ? cartKey(ct._id, activeService) : '';
                const qty = cartMap.get(key)?.quantity ?? 0;
                const price = activeService ? priceFor(ct, activeService) : undefined;
                return (
                  <Grid key={ct._id} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                    <Card
                      variant="outlined"
                      onClick={() => addToCart(ct)}
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                        '&:active': { transform: 'scale(0.96)' },
                        position: 'relative',
                      }}
                    >
                      {qty > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }}
                        >
                          {qty}
                        </Box>
                      )}
                      <Typography fontSize={28}>{getClothTypeIcon(ct)}</Typography>
                      <Typography variant="caption" noWrap display="block">
                        {ct.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ overflowWrap: 'break-word' }}
                        color={price !== undefined ? 'primary.main' : 'text.disabled'}
                        fontWeight={600}
                      >
                        {price !== undefined ? formatCurrency(price) : 'Not set'}
                      </Typography>
                    </Card>
                  </Grid>
                );
              })}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                <Card
                  variant="outlined"
                  onClick={() => setAddTypeOpen(true)}
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    transition: 'transform 0.15s ease',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  <Typography fontSize={28}>➕</Typography>
                  <Typography variant="caption" noWrap display="block">
                    New Type
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Card>

      <Dialog open={addTypeOpen} onClose={() => setAddTypeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Cloth Type</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            autoFocus
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTypeOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newTypeName.trim() || isCreatingType} onClick={handleCreateType}>
            {isCreatingType ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
