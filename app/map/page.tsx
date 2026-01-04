'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center: UEF - 141 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM
const defaultCenter = {
  lat: 10.796317,
  lng: 106.702580,
};

export default function MapPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const router = useRouter();

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();

      if (userLocation) {
        // Calculate distance
        const storesWithDistance = (data.stores || []).map((store: Store) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            store.gpsLocation.lat,
            store.gpsLocation.lng
          );
          return { ...store, distance };
        });

        // Sort by distance
        storesWithDistance.sort((a: Store, b: Store) => (a.distance || 0) - (b.distance || 0));
        setStores(storesWithDistance);
      } else {
        setStores(data.stores || []);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching stores:', error);
      toast.error('Không thể tải danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Initial Setup: Auth & Geolocation (Run ONCE)
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
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        () => {
          console.log('Using default location');
          setUserLocation(defaultCenter);
          setMapCenter(defaultCenter);
        }
      );
    } else {
      setUserLocation(defaultCenter);
      setMapCenter(defaultCenter);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]); // Removed fetchStores to avoid loop

  // Fetch Data Effect (Run when fetchStores changes, i.e., when userLocation changes)
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
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
    setMapCenter(store.gpsLocation);
  };

  const handleDirections = (store: Store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.gpsLocation.lat},${store.gpsLocation.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Bản đồ Eco</h1>
        <p className="text-sm text-dark-500">Tìm điểm mượn/trả ly gần bạn</p>
      </header>

      <div className="flex-1 relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
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

        {/* Google Map */}
        {googleMapsApiKey ? (
          <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={14}
              options={{
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }],
                  },
                ],
              }}
            >
              {/* User Location Marker */}
              {userLocation && typeof window !== 'undefined' && window.google?.maps?.SymbolPath && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#22c55e',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }}
                  title="Vị trí của bạn"
                />
              )}

              {/* Store Markers */}
              {filteredStores.map((store) => (
                <Marker
                  key={store.storeId}
                  position={store.gpsLocation}
                  onClick={() => handleMarkerClick(store)}
                  title={store.name}
                />
              ))}

              {/* Info Window */}
              {selectedStore && (
                <InfoWindow
                  position={selectedStore.gpsLocation}
                  onCloseClick={() => setSelectedStore(null)}
                >
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg text-dark-800 mb-2">{selectedStore.name}</h3>
                    <p className="text-sm text-dark-600 mb-2">{selectedStore.address}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-dark-400 mb-1">Ly có sẵn</p>
                        <p className="text-lg font-bold text-primary-600">
                          {selectedStore.cupInventory.available}/{selectedStore.cupInventory.total}
                        </p>
                      </div>
                      {selectedStore.distance && (
                        <div className="text-right">
                          <p className="text-xs text-dark-400 mb-1">Khoảng cách</p>
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
                      className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      Chỉ đường
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-100">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-600 font-semibold mb-2">Google Maps API Key chưa được cấu hình</p>
              <p className="text-sm text-dark-500">
                Vui lòng thêm NEXT_PUBLIC_GOOGLE_MAPS_API_KEY vào .env.local
              </p>
            </div>
          </div>
        )}

        {/* Stores List (Sidebar) */}
        {filteredStores.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 max-h-[40vh] overflow-y-auto bg-white/95 backdrop-blur-md border-t border-primary-100 shadow-xl z-20">
            <div className="p-4">
              <h3 className="font-semibold text-dark-800 mb-3">
                {filteredStores.length} cửa hàng {searchQuery && `cho "${searchQuery}"`}
              </h3>
              <div className="space-y-3">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.storeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleMarkerClick(store)}
                    className={`bg-white rounded-xl p-4 shadow-md border-2 cursor-pointer transition-all ${selectedStore?.storeId === store.storeId
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-dark-100 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-dark-800 mb-1">{store.name}</h4>
                        <p className="text-xs text-dark-500 mb-2">{store.address}</p>
                        {store.distance && (
                          <p className="text-sm text-primary-600 font-medium">
                            {store.distance < 1
                              ? `${Math.round(store.distance * 1000)}m`
                              : `${store.distance.toFixed(1)}km`}{' '}
                            từ bạn
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-dark-400 mb-1">Ly có sẵn</p>
                        <p className="text-lg font-bold text-primary-600">
                          {store.cupInventory?.available || 0}/{store.cupInventory?.total || 0}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirections(store);
                      }}
                      className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition mt-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Chỉ đường
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

