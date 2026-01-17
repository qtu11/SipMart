/**
 * IoT Command Handler for SipSmart e-Bike System
 * 
 * Supports:
 * - MQTT-based bike lock/unlock
 * - Real-time GPS tracking
 * - Battery monitoring
 * - Geofencing alerts
 */

// MQTT Configuration (environment-based)
export const MQTT_CONFIG = {
    broker: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: `sipsmart-server-${Date.now()}`,
    topics: {
        bikeCommand: 'sipsmart/bikes/{bikeId}/command',
        bikeStatus: 'sipsmart/bikes/{bikeId}/status',
        bikeTelemetry: 'sipsmart/bikes/{bikeId}/telemetry',
        geofenceAlert: 'sipsmart/bikes/{bikeId}/alert',
        stationStatus: 'sipsmart/stations/{stationId}/status',
    },
};

// Command types
export type IoTCommandType =
    | 'UNLOCK'
    | 'LOCK'
    | 'LOCATE'
    | 'ALARM_ON'
    | 'ALARM_OFF'
    | 'BATTERY_CHECK'
    | 'FIRMWARE_UPDATE';

export interface IoTCommand {
    commandId: string;
    bikeId: string;
    commandType: IoTCommandType;
    payload?: Record<string, any>;
    timestamp: Date;
    expiresAt: Date;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface BikeStatus {
    bikeId: string;
    isLocked: boolean;
    batteryLevel: number;           // 0-100%
    batteryVoltage: number;         // Volts
    gpsLat: number;
    gpsLng: number;
    gpsAccuracy: number;            // meters
    speed: number;                  // km/h
    lastSeen: Date;
    signalStrength: number;         // -120 to 0 dBm
    firmwareVersion: string;
    alertStatus: 'normal' | 'tamper' | 'geofence' | 'battery_low';
}

export interface TelemetryData {
    bikeId: string;
    timestamp: Date;
    gpsRoute: { lat: number; lng: number; timestamp: Date }[];
    avgSpeed: number;
    maxSpeed: number;
    distanceKm: number;
    batteryUsed: number;            // Percentage consumed
    regeneratedWh: number;          // Energy from regenerative braking
}

/**
 * Send IoT command to bike
 * In production: Publish to MQTT broker
 */
export async function sendBikeCommand(
    bikeId: string,
    commandType: IoTCommandType,
    payload?: Record<string, any>
): Promise<{ success: boolean; commandId: string; message: string }> {
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const command: IoTCommand = {
        commandId,
        bikeId,
        commandType,
        payload,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
        priority: commandType === 'UNLOCK' || commandType === 'LOCK' ? 'high' : 'normal',
    };

    console.log(`[IoT] Sending command to bike ${bikeId}:`, JSON.stringify(command));

    // MOCK: In production, publish to MQTT broker
    // const mqtt = require('mqtt');
    // const client = mqtt.connect(MQTT_CONFIG.broker);
    // const topic = MQTT_CONFIG.topics.bikeCommand.replace('{bikeId}', bikeId);
    // client.publish(topic, JSON.stringify(command));

    // Simulate command acknowledgment
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log to database for audit
    // await logIoTCommand(command);

    return {
        success: true,
        commandId,
        message: `Command ${commandType} sent to bike ${bikeId}`,
    };
}

/**
 * Unlock bike for rental
 */
export async function unlockBike(bikeId: string, rentalId: string): Promise<boolean> {
    const result = await sendBikeCommand(bikeId, 'UNLOCK', { rentalId });
    return result.success;
}

/**
 * Lock bike after return
 */
export async function lockBike(bikeId: string): Promise<boolean> {
    const result = await sendBikeCommand(bikeId, 'LOCK');
    return result.success;
}

/**
 * Get real-time bike status
 * In production: Query from MQTT last-will or database cache
 */
export async function getBikeStatus(bikeId: string): Promise<BikeStatus | null> {
    // MOCK: Return simulated status
    // In production, query from Redis cache or MQTT retained message

    return {
        bikeId,
        isLocked: true,
        batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
        batteryVoltage: 48 + Math.random() * 4, // 48-52V
        gpsLat: 10.8231 + Math.random() * 0.01,
        gpsLng: 106.6297 + Math.random() * 0.01,
        gpsAccuracy: Math.floor(Math.random() * 10) + 5,
        speed: 0,
        lastSeen: new Date(),
        signalStrength: -70 - Math.floor(Math.random() * 30),
        firmwareVersion: '2.1.3',
        alertStatus: 'normal',
    };
}

/**
 * Check if bike is within geofence zone
 */
export function isWithinGeofence(
    bikeLat: number,
    bikeLng: number,
    stationLat: number,
    stationLng: number,
    radiusMeters: number = 50
): boolean {
    const R = 6371000; // Earth's radius in meters
    const dLat = (stationLat - bikeLat) * Math.PI / 180;
    const dLng = (stationLng - bikeLng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(bikeLat * Math.PI / 180) * Math.cos(stationLat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusMeters;
}

/**
 * Send geofence alert
 */
export async function sendGeofenceAlert(
    bikeId: string,
    userId: string,
    alertType: 'exit_zone' | 'tamper' | 'unauthorized_move'
): Promise<void> {
    console.log(`[IoT ALERT] Bike ${bikeId}: ${alertType}`);

    // In production:
    // 1. Send push notification to user
    // 2. Alert admin dashboard
    // 3. Log to security events table
    // 4. Optionally send ALARM_ON command to bike
}

/**
 * Calculate estimated range based on battery
 */
export function calculateEstimatedRange(batteryLevel: number): number {
    // Assuming 50km range at 100% battery
    const maxRange = 50;
    return Math.floor((batteryLevel / 100) * maxRange);
}
