/**
 * Geofencing & GPS Verification Module
 * Calculates geodesic distance between customer GPS coordinates and restaurant coordinates.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceResult {
  isWithin: boolean;
  distanceMeters: number;
  restaurantLocation: {
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
}

// Default Coordinates for Shisha & Manoosha (Rafidia Main Street, Nablus, Palestine)
export const DEFAULT_RESTAURANT_COORDINATES = {
  name: 'مطعم وكافيه شيشة ومنقوشة (نابلس - رفيديا)',
  latitude: 32.2272,
  longitude: 35.2289,
  radiusMeters: 350, // 350m allowed radius to account for indoor GPS drift
};

/**
 * Calculates geodesic distance in meters between two lat/lon coordinates using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Checks if a given coordinate is within the allowed restaurant perimeter.
 */
export function verifyCustomerLocation(
  clientCoords: Coordinates,
  restaurantCoords = DEFAULT_RESTAURANT_COORDINATES
): GeofenceResult {
  const distanceMeters = calculateDistanceMeters(
    clientCoords.latitude,
    clientCoords.longitude,
    restaurantCoords.latitude,
    restaurantCoords.longitude
  );

  return {
    isWithin: distanceMeters <= restaurantCoords.radiusMeters,
    distanceMeters,
    restaurantLocation: restaurantCoords,
  };
}
