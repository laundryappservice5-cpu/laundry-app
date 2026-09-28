import { useGetSettingsQuery } from '../api/settingsApi';

// Root Admin can switch the whole app between v1 (the stable baseline) and v2 (new work in
// progress) from Profile. Defaults to 1 while settings are loading or if unset.
export function useAppVersion(): 1 | 2 {
  const { data: settings } = useGetSettingsQuery();
  return settings?.appVersion ?? 1;
}
