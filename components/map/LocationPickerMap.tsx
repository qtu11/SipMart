'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

// --- Icons ---
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

// Green Icon for E-bike Stations
const stationIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-10-8-14a8 8 0 0 1 16 0c0 4-8 14-8 14z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// Orange Icon for Stores
const storeIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #f97316; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
  </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// Red Editable Marker
const targetIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); animation: pulse 1s infinite;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
  </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

// Add pulse animation style
const pulseStyle = `
@keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
`;

interface LocationPickerMapProps {
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (lat: number, lng: number) => void;
    existingStations?: any[];
    existingStores?: any[];
}

function DraggableMarker({ position, onChange }: { position: L.LatLng, onChange: (lat: number, lng: number) => void }) {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onChange(lat, lng);
                }
            },
        }),
        [onChange]
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={targetIcon}
            zIndexOffset={100}
        />
    );
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Auto-center map on initial load or if position changes drastically
function MapRecenter({ lat, lng }: { lat: number, lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
}

export default function LocationPickerMap({
    initialLat,
    initialLng,
    onLocationChange,
    existingStations = [],
    existingStores = []
}: LocationPickerMapProps) {
    // Default to Ho Chi Minh City if no init coords
    const [position, setPosition] = useState<L.LatLng>(
        new L.LatLng(initialLat || 10.762622, initialLng || 106.660172)
    );
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition(new L.LatLng(initialLat, initialLng));
        }
    }, [initialLat, initialLng]);

    const handleMarkerMove = (lat: number, lng: number) => {
        const newPos = new L.LatLng(lat, lng);
        setPosition(newPos);
        onLocationChange(lat, lng);
    };

    // Use OpenStreetMap Nominatim for search
    const handleSearch = async () => {
        if (!searchTerm) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                handleMarkerMove(newLat, newLng);
            } else {
                alert('Không tìm thấy địa điểm này');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="w-full space-y-2">
            <style>{pulseStyle}</style>

            {/* Search Bar */}
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm địa điểm (VD: Bitexco, Chợ Bến Thành...)"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                    Tìm
                </button>
            </div>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DraggableMarker position={position} onChange={handleMarkerMove} />
                    <MapClickHandler onClick={handleMarkerMove} />
                    <MapRecenter lat={position.lat} lng={position.lng} />

                    {/* Show Existing E-bike Stations */}
                    {existingStations.map((station) => (
                        station.gps_lat && station.gps_lng ? (
                            <Marker
                                key={`station-${station.station_id}`}
                                position={[station.gps_lat, station.gps_lng]}
                                icon={stationIcon}
                            >
                                <Popup>{station.name} (Trạm sạc)</Popup>
                            </Marker>
                        ) : null
                    ))}

                    {/* Show Existing Stores */}
                    {existingStores.map((store) => (
                        store.gpsLat && store.gpsLng ? (
                            <Marker
                                key={`store-${store.storeId}`}
                                position={[store.gpsLat, store.gpsLng]}
                                icon={storeIcon}
                            >
                                <Popup>{store.name} (Cửa hàng)</Popup>
                            </Marker>
                        ) : null
                    ))}

                </MapContainer>

                {/* Overlay Controls */}
                <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg shadow-md z-[1000] text-xs">
                    <p className="font-semibold mb-1">Chú thích:</p>
                    <div className="flex items-center gap-1 mb-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                        <span>Vị trí mới (Kéo thả)</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                        <span>Trạm sạc (Có sẵn)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div>
                        <span>Cửa hàng</span>
                    </div>
                </div>

                <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-lg shadow-md z-[1000] text-xs font-mono">
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                </div>
            </div>
            <p className="text-xs text-gray-500 italic">
                * Kéo thả chấm đỏ hoặc click vào bản đồ để chọn vị trí chính xác.
            </p>
        </div>
    );
}
