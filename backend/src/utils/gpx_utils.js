'use strict';

/**
 * Utility to parse GPX files and extract trackpoints with elevation and distance.
 */
const GpxUtils = {
    /**
     * Parses a GPX XML string into an array of points
     * @param {string} xmlString 
     * @returns {Array<{lat, lon, ele, dist}>}
     */
    parse(xmlString) {
        const getTag = (str, tag) => {
            const m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
            return m ? m[1].trim() : null;
        };

        const getAttr = (str, attr) => {
            const m = str.match(new RegExp(`${attr}="([^"]+)"`));
            return m ? m[1] : null;
        };

        const trkpts = [];
        const trkptRe = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
        let m;

        while ((m = trkptRe.exec(xmlString)) !== null) {
            const attrs = m[1];
            const content = m[2];
            const lat = parseFloat(getAttr(attrs, 'lat'));
            const lon = parseFloat(getAttr(attrs, 'lon'));
            const ele = parseFloat(getTag(content, 'ele') || '0');

            if (!isNaN(lat) && !isNaN(lon)) {
                trkpts.push({ lat, lon, ele });
            }
        }

        if (trkpts.length < 2) return null;

        // Calculate cumulative distance using Haversine
        let totalDist = 0;
        trkpts[0].dist = 0;

        for (let i = 1; i < trkpts.length; i++) {
            const p1 = trkpts[i - 1];
            const p2 = trkpts[i];
            const d = this.calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
            totalDist += d;
            p2.dist = Math.round(totalDist * 10) / 10;
        }

        return trkpts;
    },

    /**
     * Haversine formula to calculate distance between two points in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};

module.exports = GpxUtils;
