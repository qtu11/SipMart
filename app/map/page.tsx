'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Search, X, MapPin } from 'lucide-react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';

interface Store {
  storeId: string;
  name: string;
  address: string;
  gpsLocation: { lat: number; lng: number };
  cupInventory: {
    available: number;
    total: number;
  };
  distance?: number;
}

// UEF Location
const UEF_LOCATION: [number, number] = [10.79508, 106.70577];

// Fallback venues if API fails or empty
const FALLBACK_VENUES = [
  { id: 'uef', name: "UEF - 141 Điện Biên Phủ", type: "University", anchor: [10.79508, 106.70577] as [number, number], color: "#d91e18" },
];

export default function MapPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>(UEF_LOCATION);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(UEF_LOCATION);
  const [zoom, setZoom] = useState(15);
  const router = useRouter();

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();

      let fetchedStores: Store[] = data.stores || [];

      if (fetchedStores.length > 0) {
        if (userLocation) {
          // Calculate distance
          fetchedStores = fetchedStores.map((store: Store) => {
            const distance = calculateDistance(
              userLocation[0],
              userLocation[1],
              store.gpsLocation.lat,
              store.gpsLocation.lng
            );
            return { ...store, distance };
          });
          fetchedStores.sort((a: Store, b: Store) => (a.distance || 0) - (b.distance || 0));
        }
        setStores(fetchedStores);
      } else {
        // Only use fallback if really needed, better to show empty state if DB is clean
        // If no stores found, just log it silently
        logger.debug('No stores found in DB');
      }

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error fetching stores', { error });
      toast.error('Không thể tải danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Initial Setup: Auth & Geolocation
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        unsubscribe = onAuthChange((user) => {
          if (!user) {
            router.push('/auth/login');
          }
        });
      }
    };
    checkAuth();

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          setMapCenter(location);
        },
        () => {
          // Geolocation denied or unavailable - use default
          setUserLocation(UEF_LOCATION);
          setMapCenter(UEF_LOCATION);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stores, searchQuery]);

  const handleMarkerClick = (store: Store) => {
    setSelectedStore(store);
    setMapCenter([store.gpsLocation.lat, store.gpsLocation.lng]);
    setZoom(17);
  };

  const handleDirections = (store: Store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.gpsLocation.lat},${store.gpsLocation.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <FallingLeaves />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Cửa hàng quanh bạn</h1>
        <p className="text-sm text-dark-500">Tìm địa điểm đổi trà ly</p>
      </header>

      <div className="flex-1 relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm cửa hàng..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-primary-100 rounded-2xl shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-dark-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-dark-400" />
              </button>
            )}
          </div>
        </div>

        {/* Pigeon Map */}
        <div className="w-full h-full min-h-[500px]">
          <Map
            height={800} // Ensuring full height
            defaultCenter={UEF_LOCATION}
            center={mapCenter}
            zoom={zoom}
            onBoundsChanged={({ center, zoom }) => {
              setMapCenter(center);
              setZoom(zoom);
            }}
          >
            {/* User Marker */}
            <Marker
              anchor={userLocation}
              payload="user"
              width={40}
              color="#22c55e"
            />

            {/* UEF University Marker */}
            <Marker
              anchor={UEF_LOCATION}
              payload="uef"
              width={50}
              color="#0066CC"
            />
            <Overlay anchor={UEF_LOCATION} offset={[0, 60]}>
              <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                🎓 UEF - 141 Điện Biên Phủ
              </div>
            </Overlay>

            {/* Store Markers */}
            {filteredStores.map((store) => (
              <Marker
                key={store.storeId}
                width={40}
                anchor={[store.gpsLocation.lat, store.gpsLocation.lng]}
                color="#ef4444" // Red for stores
                onClick={() => handleMarkerClick(store)}
              />
            ))}

            {/* Info Window (Overlay) */}
            {selectedStore && (
              <Overlay anchor={[selectedStore.gpsLocation.lat, selectedStore.gpsLocation.lng]} offset={[0, 100]}>
                <div className="bg-white p-4 rounded-xl shadow-2xl border border-primary-100 min-w-[220px] animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-dark-800 text-sm pr-4">{selectedStore.name}</h3>
                    <button onClick={() => setSelectedStore(null)} className="text-dark-400 hover:text-dark-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-dark-500 mb-3">{selectedStore.address}</p>

                  <div className="flex items-center justify-between mb-3 bg-primary-50 p-2 rounded-lg">
                    <div>
                      <p className="text-[10px] uppercase text-dark-400 font-bold">Ly có sẵn</p>
                      <p className="text-lg font-bold text-primary-600">
                        {selectedStore.cupInventory.available}/{selectedStore.cupInventory.total}
                      </p>
                    </div>
                    {selectedStore.distance && (
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-dark-400 font-bold">Khoảng cách</p>
                        <p className="text-sm font-semibold text-primary-600">
                          {selectedStore.distance < 1
                            ? `${Math.round(selectedStore.distance * 1000)}m`
                            : `${selectedStore.distance.toFixed(1)}km`}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDirections(selectedStore)}
                    className="w-full bg-primary-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-primary-600 transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-3 h-3" />
                    Chỉ đường
                  </button>
                </div>
              </Overlay>
            )}
          </Map>
        </div>

        {/* Store List (Bottom Sheet styled) */}
        {filteredStores.length > 0 && !selectedStore && (
          <div className="absolute bottom-0 left-0 right-0 max-h-[35vh] overflow-y-auto bg-white/95 backdrop-blur-md border-t border-primary-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 p-4">
            <h3 className="font-semibold text-dark-800 mb-3 text-sm uppercase tracking-wider">
              {filteredStores.length} địa điểm gần đây
            </h3>
            <div className="space-y-3 pb-safe">
              {filteredStores.map((store) => (
                <motion.div
                  key={store.storeId}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMarkerClick(store)}
                  className="bg-white rounded-xl p-3 border border-dark-100 shadow-sm flex items-center gap-3 cursor-pointer"
                >
                  <div className="bg-primary-50 w-10 h-10 rounded-full flex items-center justify-center text-primary-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-dark-800 text-sm truncate">{store.name}</h4>
                    <p className="text-xs text-dark-500 truncate">{store.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-md">
                      {store.cupInventory?.available} ly
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
