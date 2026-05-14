'use strict';

/**
 * ============================================================
 * POLYLINE UTILITIES
 * ============================================================
 * 
 * Google polyline encoding/decoding utilities.
 * Used by explore services and map components.
 * 
 * @module utils/polyline
 */

function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
}

function encodePolyline(points) {
    if (!points || points.length === 0) return '';
    
    let result = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
        const lat = point[0] ?? point.lat;
        const lng = point[1] ?? point.lng;
        
        const dLat = Math.round((lat - prevLat) * 1e5);
        const dLng = Math.round((lng - prevLng) * 1e5);
        
        prevLat = lat;
        prevLng = lng;

        const encodeValue = (v) => {
            v = v < 0 ? ~(v << 1) : v << 1;
            let str = '';
            while (v >= 0x20) {
                str += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
                v >>= 5;
            }
            str += String.fromCharCode(v + 63);
            return str;
        };

        result += encodeValue(dLat);
        result += encodeValue(dLng);
    }

    return result;
}

function simplifyPolyline(encoded, maxPoints = 50) {
    if (!encoded) return null;

    const points = decodePolyline(encoded);

    if (points.length <= maxPoints) return encoded;

    const sampled = [];
    const step = (points.length - 1) / (maxPoints - 1);
    for (let i = 0; i < maxPoints; i++) {
        const idx = Math.min(Math.round(i * step), points.length - 1);
        sampled.push(points[idx]);
    }

    return encodePolyline(sampled);
}

module.exports = {
    decodePolyline,
    encodePolyline,
    simplifyPolyline,
};
