// Where is the shopper? Each method is tried from the most to the least precise:
// GPS (browser geolocation, asks permission) → IP lookup → time zone → a default point.

const fetchJson = async (url, timeout = 8000) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Coarse position from the public IP, no permission needed (city level, a few km).
export const locateByIp = async () => {
  const data = await fetchJson('https://get.geojs.io/v1/ip/geo.json');
  const lat = Number(data.latitude);
  const lon = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('No IP position');
  return { lat, lon, accuracy: 5000, source: 'ip', countryCode: data.country_code, city: data.city };
};

// Precise position from the device (GPS / Wi-Fi), meters of accuracy. Needs HTTPS and permission.
export const locateByGps = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude, accuracy: Math.round(coords.accuracy), source: 'gps' }),
      (error) => reject(new Error(error.code === 1 ? 'denied' : 'unavailable')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });

// City and country for a point.
export const reverseGeocode = async (lat, lon, language = 'es') => {
  const data = await fetchJson(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`
  );
  return { countryCode: data.countryCode || undefined, city: data.city || data.locality || data.principalSubdivision || undefined };
};

// Last resort: a capital for the time zone, so the map still opens somewhere sensible.
const TIME_ZONE_POINTS = {
  'America/Bogota': [4.6486, -74.0628, 'CO', 'Bogotá'],
  'America/Mexico_City': [19.4326, -99.1332, 'MX', 'Ciudad de México'],
  'America/Lima': [-12.0464, -77.0428, 'PE', 'Lima'],
  'America/Santiago': [-33.4489, -70.6693, 'CL', 'Santiago'],
  'America/Argentina/Buenos_Aires': [-34.6037, -58.3816, 'AR', 'Buenos Aires'],
  'America/Sao_Paulo': [-23.5505, -46.6333, 'BR', 'São Paulo'],
  'America/Caracas': [10.4806, -66.9036, 'VE', 'Caracas'],
  'America/Guayaquil': [-0.1807, -78.4678, 'EC', 'Quito'],
  'America/New_York': [40.7128, -74.006, 'US', 'New York'],
  'Europe/Madrid': [40.4168, -3.7038, 'ES', 'Madrid'],
  'Europe/Lisbon': [38.7223, -9.1393, 'PT', 'Lisboa'],
  'Europe/Rome': [41.9028, 12.4964, 'IT', 'Roma'],
  'Europe/Warsaw': [52.2297, 21.0122, 'PL', 'Warszawa']
};
export const DEFAULT_POINT = TIME_ZONE_POINTS['America/Bogota'];

export const locateByTimeZone = () => {
  let zone;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    zone = undefined;
  }
  const point = TIME_ZONE_POINTS[zone];
  const [lat, lon, countryCode, city] = point ?? DEFAULT_POINT;
  return { lat, lon, accuracy: 20000, source: point ? 'timezone' : 'default', countryCode, city };
};

// Great-circle distance in meters.
export const distanceMeters = (a, b) => {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
};
