export function getMapsUrl(address: string, geo?: { lat: number; lng: number }): string {
  if (geo) {
    return `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
