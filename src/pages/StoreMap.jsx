import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import 'leaflet/dist/leaflet.css';
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { ExternalLink, ListPlus, LoaderCircle, MapPinned, Plus, Store, X } from 'lucide-react';
import { NODES, getNode, setActiveNode } from '../distributed/cluster';
import { fetchCatalog } from '../distributed/inventory';
import { useCluster, useRemote } from '../distributed/hooks';
import { setManualLocation, useRegion } from '../geo/region';
import { useCart } from '../cart/useCart';
import { useList } from '../list/useList';
import { useLocale } from '../i18n/useLocale';
import RegionBar from '../components/RegionBar';
import Glass from '../ui/Glass';
import ProductIcon from '../ui/ProductIcon';
import StatusDot from '../ui/StatusDot';
import StockBadge from '../ui/StockBadge';
import { glassButton, iconButton, pageHeading, primaryButton, sectionHeading, smallButton } from '../ui/classes';

const KIND_COLORS = {
  supermarket: '#f46f12',
  convenience: '#2e7d4f',
  greengrocer: '#5dbf7c',
  butcher: '#b91c1c',
  bakery: '#b45309',
  marketplace: '#7c3aed',
  deli: '#0369a1',
  seafood: '#0e7490'
};

// Follows the shopper's position as more precise fixes arrive.
const Recenter = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], Math.max(map.getZoom(), 15));
  }, [map, lat, lon]);
  return null;
};

const PickPoint = ({ active, onPick }) => {
  useMapEvents({
    click: (event) => {
      if (active) onPick(event.latlng);
    }
  });
  return null;
};

// One store's shelf: its catalog read through the cluster (with failover like any other read).
const StorePanel = ({ nodeId, onClose }) => {
  const { t, localize, formatPrice } = useLocale();
  const { activeNodeId, nodes } = useCluster();
  const { addItem } = useCart();
  const list = useList();
  const node = getNode(nodeId);
  const catalog = useRemote(nodeId, () => fetchCatalog(nodeId));
  const offers = (catalog.value?.value ?? []).filter((offer) => offer.stock > 0);
  const status = nodes[nodeId]?.status ?? 'offline';

  return (
    <Glass as="section" tone="solid" className="rounded-3xl p-5 sm:p-6" aria-labelledby="store-title" data-testid="store-panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="store-title" className={`${sectionHeading} truncate`}>{node.name}</h2>
          <p className="text-sm text-ink/70">
            {localize(node.zone)}
            {node.address ? ` · ${node.address}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink/70">
            <StatusDot status={status} /> {t(`branch.status.${status}`)} · <span className="font-mono">{node.code}</span>
            {node.osmUrl && (
              <a href={node.osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-citrus-700 hover:underline">
                OSM <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            )}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('map.close')} className={iconButton}>
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {nodeId === activeNodeId ? (
          <span className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-citrus-800">{t('detail.current')}</span>
        ) : (
          <button type="button" onClick={() => setActiveNode(nodeId)} className={`${primaryButton} min-h-11 px-4 py-2 text-sm`}>
            <Store aria-hidden="true" className="size-4" /> {t('map.shopHere')}
          </button>
        )}
      </div>

      {catalog.loading && (
        <p className="flex items-center gap-2 text-ink/70">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> {t('map.loadingShelf')}
        </p>
      )}
      {catalog.error && (
        <p className="text-rose-700">
          {t('map.shelfError')}{' '}
          <button type="button" onClick={catalog.retry} className="font-semibold underline">{t('common.retry')}</button>
        </p>
      )}
      {catalog.value && (
        <>
          <p className="mb-3 text-sm text-ink/70">
            {t('map.shelfCount', { count: offers.length })}
            {catalog.value.failover && ` · ${t('source.failover', { branch: node.name, replica: getNode(catalog.value.nodeId).name, ms: catalog.value.ms })}`}
          </p>
          <ul className="grid max-h-[32rem] gap-2 overflow-y-auto pr-1">
            {offers.map(({ product, price, stock }) => {
              const name = localize(product.name);
              return (
                <li key={product.id} className="flex items-center gap-3 rounded-2xl bg-white/55 p-2.5 ring-1 ring-white/80 ring-inset">
                  <ProductIcon product={product} size="sm" />
                  <Link to={`/product/${product.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                    <span className="block text-xs text-ink/70 tabular-nums">{formatPrice(price)} · {localize(product.unit)}</span>
                    <StockBadge stock={stock} />
                  </Link>
                  <button type="button" onClick={() => list.addItem(product.id)} aria-label={t('common.toListFor', { name })} className={`${iconButton} size-9`}>
                    <ListPlus aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNode(nodeId);
                      addItem(product.id);
                    }}
                    aria-label={t('common.addFor', { name })}
                    className={`${iconButton} size-9`}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Glass>
  );
};

const StoreMap = () => {
  const { t, localize } = useLocale();
  const region = useRegion();
  const cluster = useCluster();
  const [selected, setSelected] = useState(null);
  const [picking, setPicking] = useState(false);
  const { location } = region;
  const selectedId = selected && NODES.some((node) => node.id === selected) ? selected : null;

  const pick = ({ lat, lng }) => {
    setPicking(false);
    setSelected(null);
    setManualLocation(lat, lng);
  };

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        <h1 className={`${pageHeading} mb-2`}>{t('map.title')}</h1>
        <p className="mb-6 max-w-3xl text-ink/75">{t('map.subtitle')}</p>

        <RegionBar />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink/75" data-testid="stores-status">
            {region.storesStatus === 'loading' && (
              <span className="inline-flex items-center gap-2"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{t('map.loadingStores')}</span>
            )}
            {(region.storesStatus === 'osm' || region.storesStatus === 'cache') && t('map.storesOsm', { count: NODES.length })}
            {region.storesStatus === 'synthetic' && t('map.storesSynthetic', { count: NODES.length })}
            {region.storesStatus === 'idle' && t('map.storesIdle')}
          </p>
          <button type="button" onClick={() => setPicking((value) => !value)} aria-pressed={picking} className={picking ? `${primaryButton} min-h-11 px-4 py-2 text-sm` : smallButton}>
            <MapPinned aria-hidden="true" className="size-4" />
            {picking ? t('map.pickActive') : t('map.pick')}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Glass className={`overflow-hidden rounded-3xl p-1.5 ${picking ? 'ring-2 ring-citrus-500' : ''}`}>
            {location ? (
              <MapContainer center={[location.lat, location.lon]} zoom={15} scrollWheelZoom className="h-[55vh] min-h-80 w-full rounded-[1.25rem]" style={{ cursor: picking ? 'crosshair' : undefined }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Recenter lat={location.lat} lon={location.lon} />
                <PickPoint active={picking} onPick={pick} />
                {location.accuracy < 3000 && <Circle center={[location.lat, location.lon]} radius={location.accuracy} pathOptions={{ color: '#0369a1', weight: 1, fillOpacity: 0.08 }} />}
                <CircleMarker center={[location.lat, location.lon]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#0369a1', fillOpacity: 1 }}>
                  <Tooltip>{t('map.you')}</Tooltip>
                </CircleMarker>
                {NODES.filter((node) => Number.isFinite(node.lat)).map((node) => {
                  const status = cluster.nodes[node.id]?.status;
                  const isSelected = node.id === selectedId;
                  return (
                    <CircleMarker
                      key={node.id}
                      center={[node.lat, node.lon]}
                      radius={isSelected ? 13 : 10}
                      pathOptions={{
                        color: node.id === cluster.activeNodeId ? '#13201a' : '#fff',
                        weight: node.id === cluster.activeNodeId ? 3 : 2,
                        fillColor: status === 'offline' ? '#9ca3af' : KIND_COLORS[node.kind] ?? '#f46f12',
                        fillOpacity: 0.95
                      }}
                      eventHandlers={{ click: () => !picking && setSelected(node.id) }}
                    >
                      <Tooltip>{node.name} · {localize(node.zone)}</Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="flex h-[55vh] min-h-80 items-center justify-center text-ink/70">
                <LoaderCircle aria-hidden="true" className="mr-2 size-5 animate-spin" /> {t('region.locating')}
              </div>
            )}
          </Glass>

          <div>
            {selectedId ? (
              <StorePanel key={selectedId} nodeId={selectedId} onClose={() => setSelected(null)} />
            ) : (
              <Glass as="section" tone="solid" className="rounded-3xl p-5 sm:p-6" aria-labelledby="nearby-title">
                <h2 id="nearby-title" className={`${sectionHeading} mb-1`}>{t('map.nearby')}</h2>
                <p className="mb-4 text-sm text-ink/70">{t('map.nearbyHint')}</p>
                <ul className="space-y-2">
                  {NODES.map((node) => (
                    <li key={node.id}>
                      <button type="button" onClick={() => setSelected(node.id)} className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl bg-white/55 px-4 py-2.5 text-left ring-1 ring-white/80 transition ring-inset hover:bg-white/80">
                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: KIND_COLORS[node.kind] ?? '#f46f12' }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{node.name}</span>
                          <span className="block truncate text-sm text-ink/65">{localize(node.zone)}</span>
                        </span>
                        <StatusDot status={cluster.nodes[node.id]?.status ?? 'offline'} />
                      </button>
                    </li>
                  ))}
                </ul>
                <Link to="/planner" className={`${glassButton} mt-5 w-full`}>{t('map.toPlanner')}</Link>
              </Glass>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
