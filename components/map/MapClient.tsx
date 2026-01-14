'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Info, ExternalLink } from 'lucide-react';

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
    html: `<div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-10-8-14a8 8 0 0 1 16 0c0 4-8 14-8 14z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
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

function LocationMarker() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon}>
            <Popup>Bạn đang ở đây</Popup>
        </Marker>
    );
}

export default function MapClient() {
    const defaultCenter: [number, number] = [10.7938, 106.6997]; // Default: UEF
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/stores?activeOnly=true');
                const data = await res.json();
                if (data.stores) {
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

    const openDirections = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <div className="h-[calc(100vh-180px)] w-full relative z-0">
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

                {stores.map(store => (
                    <Marker
                        key={store.storeId}
                        position={[store.gpsLocation.lat, store.gpsLocation.lng]}
                        icon={stationIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[220px]">
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

                                <button
                                    onClick={() => openDirections(store.gpsLocation.lat, store.gpsLocation.lng)}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    <Navigation className="w-4 h-4" /> Chỉ đường
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocationMarker />
            </MapContainer>

            {/* Legend / Info Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg z-[400] max-w-xs hidden md:block border border-gray-100">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-gray-800">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Trạm CupSipMart
                </h4>
                <p className="text-xs text-gray-500 mb-3">Tìm trạm gần nhất để mượn hoặc trả ly.</p>
                <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    <span className="text-green-800 font-medium">Điểm mượn/trả ly</span>
                </div>
            </div>
        </div>
    );
}
