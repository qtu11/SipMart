'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Info, Crosshair, Copy, Check, Route, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icon in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

// Custom Icon for Stations
const stationIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #10b981; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-10-8-14a8 8 0 0 1 16 0c0 4-8 14-8 14z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

// User location icon
const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2); animation: pulse 2s infinite;">
    <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
  </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

interface Store {
    storeId: string;
    name: string;
    address: string;
    gpsLocation: {
        lat: number;
        lng: number;
    };
    cupInventory: {
        available: number;
    };
}

interface CoordInputProps {
    onJumpTo: (lat: number, lng: number) => void;
}

function CoordInputPanel({ onJumpTo }: CoordInputProps) {
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    const handleJump = () => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (!isNaN(latNum) && !isNaN(lngNum)) {
            onJumpTo(latNum, lngNum);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-[400] border border-primary-100"
        >
            <h4 className="font-bold mb-3 flex items-center gap-2 text-dark-800">
                <Crosshair className="w-5 h-5 text-primary-600" />
                Nhập Tọa Độ
            </h4>
            <div className="space-y-2">
                <div>
                    <label className="text-xs text-dark-500 mb-1 block">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="10.869461"
                        className="w-full px-3 py-2 border border-dark-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-dark-500 mb-1 block">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="106.800839"
                        className="w-full px-3 py-2 border border-dark-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleJump}
                    className="w-full bg-primary-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-600 transition flex items-center justify-center gap-2"
                >
                    <MapPin className="w-4 h-4" />
                    Đến Vị Trí
                </button>
            </div>
        </motion.div>
    );
}

interface ClickedLocationProps {
    onClose: () => void;
    lat: number;
    lng: number;
}

function ClickedLocationPanel({ onClose, lat, lng }: ClickedLocationProps) {
    const [copied, setCopied] = useState(false);

    const copyCoords = () => {
        navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl z-[400] border border-primary-100 min-w-[280px]"
        >
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-dark-800">Vị Trí Đã Chọn</h4>
                <button onClick={onClose} className="text-dark-400 hover:text-dark-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="space-y-2">
                <div className="bg-dark-50 p-3 rounded-lg">
                    <p className="text-xs text-dark-500 mb-1">Latitude</p>
                    <p className="text-sm font-mono font-semibold text-dark-800">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-dark-50 p-3 rounded-lg">
                    <p className="text-xs text-dark-500 mb-1">Longitude</p>
                    <p className="text-sm font-mono font-semibold text-dark-800">{lng.toFixed(6)}</p>
                </div>
                <button
                    onClick={copyCoords}
                    className="w-full bg-primary-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-600 transition flex items-center justify-center gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Đã Copy!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy Tọa Độ
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function JumpToLocation({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 16, {
            duration: 1.5,
        });
    }, [lat, lng, map]);
    return null;
}

// Auto-fit bounds to show all store markers (runs once only)
function FitBoundsToStores({ stores }: { stores: Store[] }) {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (stores.length > 0 && !hasFittedRef.current) {
            hasFittedRef.current = true;
            const bounds = L.latLngBounds(
                stores.map(s => [s.gpsLocation.lat, s.gpsLocation.lng] as [number, number])
            );
            // Delay slightly to ensure map is ready
            setTimeout(() => {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
            }, 100);
        }
    }, [stores, map]);

    return null;
}

function LocationMarker({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMap();
    const hasLocatedRef = useRef(false);

    useEffect(() => {
        if (hasLocatedRef.current) return;

        map.locate().on("locationfound", function (e) {
            if (!hasLocatedRef.current) {
                hasLocatedRef.current = true;
                setPosition(e.latlng);
                // Don't flyTo - let FitBoundsToStores handle the initial view
                if (onLocationFound) {
                    onLocationFound(e.latlng.lat, e.latlng.lng);
                }
            }
        });
    }, [map, onLocationFound]);

    return position === null ? null : (
        <Marker position={position} icon={userIcon}>
            <Popup>
                <div className="font-semibold">📍 Vị trí của bạn</div>
            </Popup>
        </Marker>
    );
}

export default function SmartMapClient() {
    const defaultCenter: [number, number] = [10.869461, 106.800839]; // UEF coordinates
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [jumpTo, setJumpTo] = useState<[number, number] | null>(null);
    const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][] | null>(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/stores?activeOnly=true');
                const data = await res.json();
                if (data.data?.stores) {
                    setStores(data.data.stores);
                } else if (data.stores) {
                    setStores(data.stores);
                }
            } catch (error) {
                console.error("Failed to fetch stores", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const handleJumpTo = (lat: number, lng: number) => {
        setJumpTo([lat, lng]);
        setClickedLocation({ lat, lng });
    };

    const handleMapClick = (lat: number, lng: number) => {
        setClickedLocation({ lat, lng });
    };

    const handleShowRoute = (store: Store) => {
        if (userLocation) {
            setSelectedStore(store);
            // Simple straight line route (in real app, use routing API)
            setRoutePath([
                [userLocation.lat, userLocation.lng],
                [store.gpsLocation.lat, store.gpsLocation.lng],
            ]);
        } else {
            alert('Vui lòng cho phép truy cập vị trí để xem đường đi');
        }
    };

    const openGoogleMapsDirections = (lat: number, lng: number) => {
        if (userLocation) {
            window.open(
                `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`,
                '_blank'
            );
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] w-full relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler onMapClick={handleMapClick} />

                {/* Auto-fit map to show all store markers */}
                {!loading && stores.length > 0 && <FitBoundsToStores stores={stores} />}

                {jumpTo && <JumpToLocation lat={jumpTo[0]} lng={jumpTo[1]} />}

                {stores.map(store => (
                    <Marker
                        key={store.storeId}
                        position={[store.gpsLocation.lat, store.gpsLocation.lng]}
                        icon={stationIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[240px]">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{store.name}</h3>
                                <p className="text-sm text-gray-600 mb-3 flex items-start gap-1">
                                    <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                                    {store.address}
                                </p>

                                <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg">
                                    <span className="text-sm text-gray-500">Ly có sẵn:</span>
                                    <span className={`text-sm font-bold ${store.cupInventory.available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {store.cupInventory.available > 0 ? `${store.cupInventory.available} ly` : 'Hết ly'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleShowRoute(store)}
                                        className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                                    >
                                        <Route className="w-4 h-4" /> Xem Đường Đi
                                    </button>
                                    <button
                                        onClick={() => openGoogleMapsDirections(store.gpsLocation.lat, store.gpsLocation.lng)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        <Navigation className="w-4 h-4" /> Google Maps
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocationMarker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })} />

                {routePath && (
                    <Polyline
                        positions={routePath}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.7}
                        dashArray="10, 10"
                    />
                )}
            </MapContainer>

            <CoordInputPanel onJumpTo={handleJumpTo} />

            <AnimatePresence>
                {clickedLocation && (
                    <ClickedLocationPanel
                        lat={clickedLocation.lat}
                        lng={clickedLocation.lng}
                        onClose={() => setClickedLocation(null)}
                    />
                )}
            </AnimatePresence>

            {/* Legend */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-[400] max-w-xs border border-primary-100"
            >
                <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-800">
                    <Info className="w-4 h-4 text-primary-600" />
                    Hướng Dẫn
                </h4>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
                        <span className="text-gray-700">Trạm CupSipMart</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
                        <span className="text-gray-700">Vị trí của bạn</span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <p className="text-gray-600">
                        • Click vào map để lấy tọa độ<br />
                        • Nhập tọa độ để đến vị trí<br />
                        • Click marker để xem thông tin
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
