import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useLocale } from '../i18n/useLocale';

// Live map of one delivery: the store, the door and the courier riding between them.
const Fit = ({ store, home }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[store.lat, store.lon], [home.lat, home.lon]], { padding: [48, 48], maxZoom: 16 });
  }, [map, store.lat, store.lon, home.lat, home.lon]);
  return null;
};

const TrackingMap = ({ store, home, courier }) => {
  const { t } = useLocale();
  return (
    <MapContainer center={[home.lat, home.lon]} zoom={14} scrollWheelZoom={false} className="h-72 w-full rounded-2xl sm:h-96" aria-label={t('orders.map')}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <Fit store={store} home={home} />
      <Polyline positions={[[store.lat, store.lon], [home.lat, home.lon]]} pathOptions={{ color: '#13201a', weight: 2, dashArray: '6 8', opacity: 0.5 }} />
      <CircleMarker center={[store.lat, store.lon]} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#f46f12', fillOpacity: 1 }}>
        <Tooltip permanent direction="top">{t('orders.mapStore')}</Tooltip>
      </CircleMarker>
      <CircleMarker center={[home.lat, home.lon]} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2e7d4f', fillOpacity: 1 }}>
        <Tooltip permanent direction="top">{t('orders.mapHome')}</Tooltip>
      </CircleMarker>
      {courier && (
        <CircleMarker center={[courier.lat, courier.lon]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
          <Tooltip permanent direction="bottom">{t('orders.mapCourier')}</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
};

export default TrackingMap;
