'use client';

import React from 'react';
import { MapPin, Bike, Coffee } from 'lucide-react';

interface HeatmapWidgetProps {
    bikeHotspots?: { name: string; count: number; intensity: 'high' | 'medium' | 'low' }[];
}

const defaultHotspots = [
    { name: 'Quận 1', count: 45, intensity: 'high' as const },
    { name: 'Quận 3', count: 32, intensity: 'medium' as const },
    { name: 'Quận 7', count: 28, intensity: 'medium' as const },
    { name: 'Thủ Đức', count: 15, intensity: 'low' as const },
    { name: 'Bình Thạnh', count: 38, intensity: 'high' as const },
];

const intensityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
};

const intensityBg = {
    high: 'bg-red-100 dark:bg-red-900/20',
    medium: 'bg-amber-100 dark:bg-amber-900/20',
    low: 'bg-emerald-100 dark:bg-emerald-900/20',
};

export default function HeatmapWidget({ bikeHotspots }: HeatmapWidgetProps) {
    const hotspots = (bikeHotspots && bikeHotspots.length > 0) ? bikeHotspots : defaultHotspots;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Bản đồ Mật độ
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Vùng nhu cầu cao cần điều phối
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-slate-500">Cao</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-slate-500">TB</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Thấp</span>
                    </div>
                </div>
            </div>

            {/* Simulated Map Grid */}
            <div className="relative h-40 mb-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                {/* Heatmap Zones (Simulated) */}
                <div className="absolute inset-0 p-2 grid grid-cols-5 grid-rows-3 gap-1">
                    {[...Array(15)].map((_, i) => {
                        const intensity = Math.random();
                        const bgOpacity = intensity > 0.7 ? 'bg-red-400/60' : intensity > 0.4 ? 'bg-amber-400/50' : 'bg-emerald-400/40';
                        return (
                            <div
                                key={i}
                                className={`rounded ${bgOpacity} transition-colors`}
                            />
                        );
                    })}
                </div>

                {/* Map Overlay Icons */}
                <div className="absolute top-4 left-6">
                    <div className="p-1.5 bg-white rounded-full shadow-md">
                        <Bike className="w-3 h-3 text-emerald-600" />
                    </div>
                </div>
                <div className="absolute top-8 right-10">
                    <div className="p-1.5 bg-white rounded-full shadow-md">
                        <Coffee className="w-3 h-3 text-amber-600" />
                    </div>
                </div>
                <div className="absolute bottom-6 left-1/2">
                    <div className="p-1.5 bg-white rounded-full shadow-md">
                        <MapPin className="w-3 h-3 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Hotspot List */}
            <div className="space-y-2">
                {hotspots.slice(0, 4).map((spot) => (
                    <div
                        key={spot.name}
                        className={`flex items-center justify-between p-2.5 rounded-lg ${intensityBg[spot.intensity]}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${intensityColors[spot.intensity]}`} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {spot.name}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {spot.count} xe
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
