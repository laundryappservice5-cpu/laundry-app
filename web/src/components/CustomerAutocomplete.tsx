import { useMemo, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useDebounce } from '../hooks/useDebounce';
import { useSearchCustomersQuery } from '../api/customerApi';
import type { Customer } from '../types';

interface CustomerAutocompleteProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

export function CustomerAutocomplete({ value, onChange }: CustomerAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(inputValue, 350);

  const { data: results, isFetching } = useSearchCustomersQuery(
    { q: debouncedQuery },
    { skip: debouncedQuery.trim().length < 3 },
  );

  const options = useMemo(() => results?.items ?? [], [results]);

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInput) => setInputValue(newInput)}
      getOptionLabel={(option) => `${option.name} — ${option.mobileNumber}`}
      isOptionEqualToValue={(option, val) => option._id === val._id}
      loading={isFetching}
      filterOptions={(opts) => opts}
      noOptionsText={inputValue.trim().length < 3 ? 'Type a name or mobile number…' : 'No customer found'}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search customer by mobile or name"
          placeholder="e.g. 9876543210"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isFetching && <CircularProgress color="inherit" size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
