package com.drawrun.app.logic

import kotlin.math.*

object MapUtils {

    /**
     * Decodes an encoded path string into a sequence of Lat/Lngs.
     */
    fun decodePolyline(encoded: String): List<Pair<Double, Double>> {
        val poly = ArrayList<Pair<Double, Double>>()
        var index = 0
        val len = encoded.length
        var lat = 0
        var lng = 0

        while (index < len) {
            var b: Int
            var shift = 0
            var result = 0
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlat = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lat += dlat

            shift = 0
            result = 0
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlng = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lng += dlng

            val p = Pair(lat.toDouble() / 1E5, lng.toDouble() / 1E5)
            poly.add(p)
        }

        return poly
    }

    /**
     * Converts a lat/lng to a pixel coordinate within a specific tile at a specific zoom.
     * returns (pixelX, pixelY) relative to the top-left of the entire world map at this zoom.
     */
    fun latLngToWorldPixel(lat: Double, lng: Double, zoom: Int): Pair<Double, Double> {
         val n = 1 shl zoom
         val x = (lng + 180.0) / 360.0 * n * 256.0
         val latRad = Math.toRadians(lat)
         val y = (1.0 - ln(tan(latRad) + 1 / cos(latRad)) / Math.PI) / 2.0 * n * 256.0
         return Pair(x, y)
    }
    
    /**
     * Calculates optimal zoom level to fit bounds in view with padding
     */
    fun getOptimalZoom(minLat: Double, maxLat: Double, minLng: Double, maxLng: Double, viewWidth: Int, viewHeight: Int): Int {
        if (viewWidth <= 0 || viewHeight <= 0) return 12
        
        // Add padding (e.g. 10%)
        val paddedWidth = viewWidth * 0.9
        val paddedHeight = viewHeight * 0.9
        
        val latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI
        val lngDiff = maxLng - minLng
        val lngFraction = (if (lngDiff < 0) lngDiff + 360 else lngDiff) / 360
        
        val latZoom = log2(paddedHeight / 256.0 / abs(latFraction))
        val lngZoom = log2(paddedWidth / 256.0 / abs(lngFraction))
        
        val zoom = min(latZoom, lngZoom).toInt()
        return zoom.coerceIn(0, 19)
    }
    
    private fun latRad(lat: Double): Double {
        val sinVal = sin(lat * Math.PI / 180)
        val radX2 = ln((1 + sinVal) / (1 - sinVal)) / 2
        return max(min(radX2, Math.PI), -Math.PI) / 2
    }
    
    fun log2(x: Double): Double = ln(x) / ln(2.0)
}
