'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

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
    html: `<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-10-8-14a8 8 0 0 1 16 0c0 4-8 14-8 14z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// Stations Data (Mock)
const stations = [
    { id: 1, name: 'SipMart UEF', lat: 10.7938, lng: 106.6997, address: '141 Điện Biên Phủ, Bình Thạnh', cups: 15 },
    { id: 2, name: 'SipMart Hutech', lat: 10.8018, lng: 106.7143, address: '475A Điện Biên Phủ, Bình Thạnh', cups: 8 },
    { id: 3, name: 'SipMart Betexco', lat: 10.7719, lng: 106.7044, address: '2 Hải Triều, Q.1', cups: 20 },
    { id: 4, name: 'SipMart Landmark 81', lat: 10.7950, lng: 106.7218, address: '720A Điện Biên Phủ, Bình Thạnh', cups: 12 },
];

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
    const centerPosition: [number, number] = [10.7938, 106.6997]; // Default: UEF

    return (
        <div className="h-[calc(100vh-180px)] w-full relative z-0">
            <MapContainer
                center={centerPosition}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {stations.map(station => (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lng]}
                        icon={stationIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[200px]">
                                <h3 className="font-bold text-primary-600 text-lg mb-1">{station.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{station.address}</p>
                                <div className="flex items-center gap-2 text-sm font-medium bg-green-50 text-green-700 px-2 py-1 rounded-lg w-fit">
                                    🍵 {station.cups} ly có sẵn
                                </div>
                                <button className="mt-3 w-full bg-primary-500 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-600 transition">
                                    Chỉ đường
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocationMarker />
            </MapContainer>

            {/* Legend / Info Overlay */}
            <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-lg z-[400] max-w-xs hidden md:block">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    Trạm CupSipMart
                </h4>
                <p className="text-xs text-gray-500 mb-3">Tìm trạm gần nhất để mượn hoặc trả ly.</p>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Điểm mượn/trả ly</span>
                </div>
            </div>
        </div>
    );
}
