/* eslint-disable unused-imports/no-unused-vars, no-undef, no-process-exit, no-control-regex, no-dupe-keys */
/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection, no-console */
'use strict';

/**
 * Activity Parser Service
 * 
 * Unified parser for multiple activity file formats:
 * - GPX (XML) - GPS Exchange Format
 * - TCX (XML) - Training Center XML (Garmin)
 * - FIT (Binary) - Flexible and Interoperable Data Transfer (Garmin)
 * - Polar CSV - Polar export format
 * - Strava ZIP - Bulk export with multiple activities
 * 
 * Returns normalized activity data compatible with sync/utils.js
 */

const { DOMParser } = require('xmldom');
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Lazy load fit-file-parser to avoid loading in tests if not needed
let fitParser;

/**
 * Normalized activity structure returned by all parsers
 * @typedef {Object} ParsedActivity
 * @property {string} source - Source identifier ('gpx', 'tcx', 'fit', 'file')
 * @property {string} source_id - Unique ID from the file (filename or activity ID)
 * @property {string} name - Activity name
 * @property {string} type - Activity type ('run', 'ride', 'swim', 'hike', etc.)
 * @property {string} start_date - ISO 8601 start time
 * @property {string} [timezone] - Timezone offset
 * @property {number} [distance] - Distance in meters
 * @property {number} [moving_time] - Moving time in seconds
 * @property {number} [elapsed_time] - Elapsed time in seconds
 * @property {number} [average_speed] - Average speed in m/s
 * @property {number} [max_speed] - Max speed in m/s
 * @property {number} [average_heartrate] - Average HR in bpm
 * @property {number} [max_heartrate] - Max HR in bpm
 * @property {number} [average_cadence] - Average cadence in rpm
 * @property {number} [average_power] - Average power in watts
 * @property {number} [max_power] - Max power in watts
 * @property {number} [calories] - Calories burned
 * @property {number} [elev_high] - Max elevation in meters
 * @property {number} [elev_low] - Min elevation in meters
 * @property {number} [total_elevation_gain] - Total elevation gain in meters
 * @property {string} [map_polyline] - JSON string of [[lng, lat], ...] coordinates
 * @property {string} [device_name] - Device name
 * @property {Object} [_streams] - Stream data (GPS, HR, cadence, power, altitude)
 * @property {Object[]} [_splits] - Lap/split data
 */

/**
 * Get the FIT file parser (lazy loaded)
 * @returns {Promise<Object>} fit-file-parser instance
 */
async function getFitParser() {
    if (!fitParser) {
        // eslint-disable-next-line global-require
        const { default: FitParser } = require('fit-file-parser');
        fitParser = FitParser;
    }
    return fitParser;
}

/**
 * Detect file format from content or extension
 * @param {string} filename - Filename or path
 * @param {Buffer|string} content - File content
 * @returns {string} Format: 'gpx', 'tcx', 'fit', 'csv', 'zip', or null
 */
function detectFormat(filename, content) {
    // Detect from extension first
    const ext = filename ? filename.toLowerCase().split('.').pop() : '';
    if (ext === 'gpx') return 'gpx';
    if (ext === 'tcx') return 'tcx';
    if (ext === 'fit') return 'fit';
    if (ext === 'csv') return 'csv';
    if (ext === 'zip') return 'zip';

    // Fallback: detect from content
    if (typeof content === 'string') {
        if (content.includes('<gpx')) return 'gpx';
        if (content.includes('<TrainingCenterDatabase')) return 'tcx';
        if (content.includes('Time,Heart Rate') || content.includes('Timestamp,Heart rate')) return 'csv';
    } else if (Buffer.isBuffer(content)) {
        // Check for FIT binary signature (first byte is usually 0x12 for FIT files)
        if (content.length > 0 && content[0] === 0x12) return 'fit';
        // Check for ZIP signature (PK header)
        if (content.length >= 4 && 
            content[0] === 0x50 && content[1] === 0x4B && 
            content[2] === 0x03 && content[3] === 0x04) {
            return 'zip';
        }
        // Check for XML signatures
        const str = content.toString('utf8', 0, 200);
        if (str.includes('<gpx')) return 'gpx';
        if (str.includes('<TrainingCenterDatabase')) return 'tcx';
        // Check for CSV headers
        if (str.includes('Time,Heart Rate') || str.includes('Timestamp,Heart rate') || 
            str.includes('Time,Heart rate') || str.includes('Timestamp,Heart Rate')) {
            return 'csv';
        }
    }

    return null;
}

/**
 * Parse any activity file based on format detection
 * @param {string} filename - Filename or path
 * @param {Buffer|string} content - File content
 * @param {Object} [options] - Options
 * @param {boolean} [options.extractAllFromZip=false] - Extract all activities from ZIP
 * @returns {Promise<ParsedActivity|ParsedActivity[]|null>} Parsed activity/activities or null if unparseable
 */
async function parseActivityFile(filename, content, options = {}) {
    const format = detectFormat(filename, content);

    if (!format) {
        logger.warn('[ActivityParser] Unable to detect format', { filename });
        return null;
    }

    try {
        switch (format) {
            case 'gpx':
                return parseGPX(content);
            case 'tcx':
                return parseTCX(content);
            case 'fit':
                return await parseFIT(content);
            case 'csv':
                return parsePolarCSV(content, filename);
            case 'zip':
                return options.extractAllFromZip 
                    ? await parseStravaZip(content, filename)
                    : await parseZipSingle(content, filename);
            default:
                logger.warn('[ActivityParser] Unsupported format detected', { format, filename });
                return null;
        }
    } catch (error) {
        logger.error('[ActivityParser] Parse failed', {
            format,
            filename,
            error: error.message,
            stack: error.stack
        });
        return null;
    }
}

/**
 * Parse GPX file (XML format)
 * Supports: trkpt with lat/lon, ele, time, and extensions for HR/cadence/power
 * @param {string|Buffer} content - GPX XML content
 * @returns {ParsedActivity} Parsed activity
 */
function parseGPX(content) {
    const xmlString = Buffer.isBuffer(content) ? content.toString('utf8') : content;
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');

    const activity = {
        source: 'gpx',
        source_id: '',
        name: '',
        type: 'run',
        start_date: '',
        distance: 0,
        moving_time: 0,
        elapsed_time: 0,
        total_elevation_gain: 0,
        elev_high: null,
        elev_low: null,
        average_heartrate: null,
        max_heartrate: null,
        average_cadence: null,
        average_power: null,
        max_power: null,
        map_polyline: null,
        device_name: null,
        _streams: {},
        _splits: []
    };

    // Extract metadata
    const metadata = doc.getElementsByTagName('metadata');
    if (metadata.length > 0) {
        const meta = metadata[0];
        const nameNode = meta.getElementsByTagName('name');
        if (nameNode.length > 0) {
            activity.name = nameNode[0].textContent;
        }
        const timeNode = meta.getElementsByTagName('time');
        if (timeNode.length > 0) {
            activity.start_date = timeNode[0].textContent;
        }
    }

    // Extract track points
    const trkpts = doc.getElementsByTagName('trkpt');
    if (trkpts.length === 0) {
        logger.warn('[ActivityParser] No track points found in GPX');
        return null;
    }

    // Parse all track points
    const points = [];
    let minEle = Infinity;
    let maxEle = -Infinity;
    let totalGain = 0;
    let lastEle = null;
    let totalDistance = 0;

    // Extract namespace for extensions
    const nsResolver = (prefix) => {
        const ns = doc.lookupNamespaceURI(prefix);
        return ns || null;
    };

    for (let i = 0; i < trkpts.length; i++) {
        const trkpt = trkpts[i];
        const lat = parseFloat(trkpt.getAttribute('lat'));
        const lon = parseFloat(trkpt.getAttribute('lon'));

        if (isNaN(lat) || isNaN(lon)) continue;

        const eleNode = trkpt.getElementsByTagName('ele');
        const ele = eleNode.length > 0 ? parseFloat(eleNode[0].textContent) : 0;

        const timeNode = trkpt.getElementsByTagName('time');
        const time = timeNode.length > 0 ? timeNode[0].textContent : null;

        // Track elevation stats
        minEle = Math.min(minEle, ele);
        maxEle = Math.max(maxEle, ele);
        if (lastEle !== null && ele > lastEle) {
            totalGain += (ele - lastEle);
        }
        lastEle = ele;

        // Extract extensions (HR, cadence, power)
        let hr = null, cadence = null, power = null, speed = null;
        
        // Try Garmin extensions
        const extensions = trkpt.getElementsByTagName('extensions');
        if (extensions.length > 0) {
            const ext = extensions[0];
            
            // Garmin TrackPointExtension
            const tpExt = ext.getElementsByTagName('TrackPointExtension');
            if (tpExt.length > 0) {
                const extNode = tpExt[0];
                const hrNode = extNode.getElementsByTagName('hr');
                const cadNode = extNode.getElementsByTagName('cad');
                const powerNode = extNode.getElementsByTagName('watts');
                const speedNode = extNode.getElementsByTagName('speed');
                
                if (hrNode.length > 0) hr = parseFloat(hrNode[0].textContent);
                if (cadNode.length > 0) cadence = parseFloat(cadNode[0].textContent);
                if (powerNode.length > 0) power = parseFloat(powerNode[0].textContent);
                if (speedNode.length > 0) speed = parseFloat(speedNode[0].textContent);
            }
            
            // GPX 1.1 extensions (generic)
            const gpxx = ext.getElementsByTagName('gpxx:HeartRate');
            if (gpxx.length > 0 && !hr) {
                hr = parseFloat(gpxx[0].textContent);
            }
        }

        // Also try direct child elements (some GPX formats)
        const hrNodes = trkpt.getElementsByTagName('gpxx:HeartRate');
        if (hrNodes.length > 0 && hr === null) {
            hr = parseFloat(hrNodes[0].textContent);
        }

        points.push({
            lat,
            lon,
            ele,
            time,
            hr,
            cadence,
            power,
            speed
        });
    }

    // Set elevation stats
    activity.elev_high = maxEle !== -Infinity ? maxEle : null;
    activity.elev_low = minEle !== Infinity ? minEle : null;
    activity.total_elevation_gain = Math.round(totalGain);

    // Calculate distance using Haversine formula
    for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const d = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
        totalDistance += d;
    }
    activity.distance = Math.round(totalDistance);

    // Set start date from first point if not in metadata
    if (!activity.start_date && points[0]?.time) {
        activity.start_date = points[0].time;
    }

    // Set source_id from start_date if available
    if (activity.start_date) {
        activity.source_id = `gpx_${activity.start_date.replace(/[:.]/g, '-')}`;
    } else {
        activity.source_id = `gpx_${Date.now()}`;
    }

    // Calculate time range
    const times = points.map(p => p.time).filter(Boolean);
    if (times.length >= 2) {
        const startTime = new Date(times[0]);
        const endTime = new Date(times[times.length - 1]);
        activity.elapsed_time = Math.round((endTime - startTime) / 1000);
        activity.moving_time = activity.elapsed_time;
        activity.start_date = times[0];
    }

    // Extract streams
    const streams = {};
    
    // GPS coordinates
    const latlng = points.map(p => [p.lat, p.lon]);
    if (latlng.length > 0) {
        streams.latlng = latlng;
    }

    // Altitude
    const alts = points.map(p => p.ele);
    if (alts.length > 0 && alts.some(a => a !== 0)) {
        streams.altitude = alts;
    }

    // Heart rate
    const hrs = points.map(p => p.hr).filter(h => h !== null);
    if (hrs.length > 0) {
        streams.heartrate = hrs;
        activity.average_heartrate = Math.round(
            hrs.reduce((a, b) => a + b, 0) / hrs.length
        );
        activity.max_heartrate = Math.max(...hrs);
    }

    // Cadence
    const cads = points.map(p => p.cadence).filter(c => c !== null);
    if (cads.length > 0) {
        streams.cadence = cads;
        activity.average_cadence = Math.round(
            cads.reduce((a, b) => a + b, 0) / cads.length
        );
    }

    // Power
    const powers = points.map(p => p.power).filter(p => p !== null);
    if (powers.length > 0) {
        streams.power = powers;
        activity.average_power = Math.round(
            powers.reduce((a, b) => a + b, 0) / powers.length
        );
        activity.max_power = Math.max(...powers);
    }

    // Speed
    const speeds = points.map(p => p.speed).filter(s => s !== null);
    if (speeds.length > 0) {
        streams.velocity_smooth = speeds.map(s => s / 3.6); // Convert km/h to m/s
        activity.average_speed = Math.round(
            speeds.reduce((a, b) => a + b, 0) / speeds.length / 3.6 * 100
        ) / 100;
        activity.max_speed = Math.round(
            Math.max(...speeds) / 3.6 * 100
        ) / 100;
    }

    if (Object.keys(streams).length > 0) {
        activity._streams = streams;
    }

    // Build polyline for map display
    if (latlng.length > 0) {
        activity.map_polyline = JSON.stringify(latlng);
    }

    // Try to detect activity type from metadata or extensions
    const trk = doc.getElementsByTagName('trk');
    if (trk.length > 0) {
        const trkType = trk[0].getElementsByTagName('type');
        if (trkType.length > 0) {
            const type = trkType[0].textContent.toLowerCase();
            if (['running', 'run', 'jogging'].includes(type)) activity.type = 'run';
            else if (['cycling', 'biking', 'ride', 'bike'].includes(type)) activity.type = 'ride';
            else if (['swimming', 'swim'].includes(type)) activity.type = 'swim';
            else if (['walking', 'hiking', 'walk', 'hike'].includes(type)) activity.type = 'hike';
        }
    }

    // Fallback name
    if (!activity.name) {
        activity.name = `Activity ${activity.start_date ? new Date(activity.start_date).toLocaleDateString() : ''}`;
    }

    return activity;
}

/**
 * Parse TCX file (Training Center XML format)
 * Supports: Activity with Sport, Lap, Track, Trackpoint with Time, Position, Altitude, Distance, HR, Cadence
 * @param {string|Buffer} content - TCX XML content
 * @returns {ParsedActivity} Parsed activity
 */
function parseTCX(content) {
    const xmlString = Buffer.isBuffer(content) ? content.toString('utf8') : content;
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');

    const activity = {
        source: 'tcx',
        source_id: '',
        name: '',
        type: 'run',
        start_date: '',
        distance: 0,
        moving_time: 0,
        elapsed_time: 0,
        total_elevation_gain: 0,
        elev_high: null,
        elev_low: null,
        average_heartrate: null,
        max_heartrate: null,
        average_cadence: null,
        average_power: null,
        max_power: null,
        calories: null,
        map_polyline: null,
        device_name: null,
        _streams: {},
        _splits: []
    };

    // Get Activities
    const activities = doc.getElementsByTagName('Activity');
    if (activities.length === 0) {
        logger.warn('[ActivityParser] No Activity found in TCX');
        return null;
    }

    const act = activities[0];

    // Extract activity ID
    const idNode = act.getAttributeNode('Id');
    if (idNode) {
        activity.source_id = idNode.value;
    }

    // Extract sport type
    const sportNodes = act.getElementsByTagName('Sport');
    if (sportNodes.length > 0) {
        const sport = sportNodes[0].textContent.toLowerCase();
        const sportMap = {
            'running': 'run',
            'biking': 'ride',
            'cycling': 'ride',
            'swimming': 'swim',
            'walking': 'hike',
            'hiking': 'hike',
            'other': 'run'
        };
        activity.type = sportMap[sport] || sport || 'run';
    }

    // Extract laps for splits
    const laps = act.getElementsByTagName('Lap');
    const lapData = [];
    
    for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const lapObj = {
            split_number: i + 1,
            distance: 0,
            elapsed_time: 0,
            moving_time: 0,
            average_heartrate: null,
            max_heartrate: null,
            average_speed: null,
            max_speed: null,
            elevation_difference: null,
            pace_zone: null
        };

        // Lap start time
        const startTimeNode = lap.getAttributeNode('StartTime');
        if (startTimeNode) {
            lapObj.start_time = startTimeNode.value;
        }

        // Lap statistics
        const totalTime = parseFloatNode(lap, 'TotalTimeSeconds');
        const distanceMeters = parseFloatNode(lap, 'DistanceMeters');
        const maxSpeed = parseFloatNode(lap, 'MaximumSpeed');
        const calories = parseIntNode(lap, 'Calories');
        const avgHR = parseIntNode(lap, 'AverageHeartRateBpm');
        const maxHR = parseIntNode(lap, 'MaximumHeartRateBpm');
        const intensity = lap.getAttribute('Intensity');

        lapObj.elapsed_time = totalTime || 0;
        lapObj.moving_time = totalTime || 0;
        lapObj.distance = distanceMeters || 0;
        lapObj.average_heartrate = avgHR || null;
        lapObj.max_heartrate = maxHR || null;
        lapObj.average_speed = maxSpeed ? maxSpeed / 3.6 : null; // Convert m/s to m/s (TCX is already in m/s)
        lapObj.max_speed = maxSpeed ? maxSpeed / 3.6 : null;
        lapObj.pace_zone = intensity || null;
        lapObj.calories = calories || null;

        // Trackpoint analysis for this lap
        const trackpoints = lap.getElementsByTagName('Trackpoint');
        if (trackpoints.length > 0) {
            const firstTp = trackpoints[0];
            const lastTp = trackpoints[trackpoints.length - 1];
            
            const firstAlt = parseFloatNode(firstTp, 'AltitudeMeters');
            const lastAlt = parseFloatNode(lastTp, 'AltitudeMeters');
            if (!isNaN(firstAlt) && !isNaN(lastAlt)) {
                lapObj.elevation_difference = lastAlt - firstAlt;
            }
        }

        lapData.push(lapObj);
    }

    // Use first lap start time as activity start date
    if (lapData.length > 0 && lapData[0].start_time) {
        activity.start_date = lapData[0].start_time;
    }

    // Set source_id from start_date
    if (activity.start_date) {
        activity.source_id = `tcx_${activity.start_date.replace(/[:.]/g, '-')}`;
    } else if (activity.source_id) {
        activity.source_id = `tcx_${activity.source_id}`;
    } else {
        activity.source_id = `tcx_${Date.now()}`;
    }

    // Aggregate statistics from all laps
    let totalDistance = 0;
    let totalTime = 0;
    let totalCalories = 0;
    let allHR = [];
    let maxHR = 0;
    let minEle = Infinity;
    let maxEle = -Infinity;
    let lastEle = null;
    let totalGain = 0;

    // Collect all trackpoints across all laps
    const allPoints = [];

    for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const trackpoints = lap.getElementsByTagName('Trackpoint');

        for (let j = 0; j < trackpoints.length; j++) {
            const tp = trackpoints[j];

            // Position
            const position = tp.getElementsByTagName('Position');
            let lat = null, lon = null;
            if (position.length > 0) {
                lat = parseFloat(position[0].getAttribute('LatitudeDegrees'));
                lon = parseFloat(position[0].getAttribute('LongitudeDegrees'));
            }

            // Altitude
            const altNode = tp.getElementsByTagName('AltitudeMeters');
            const alt = altNode.length > 0 ? parseFloat(altNode[0].textContent) : null;

            // Distance
            const distNode = tp.getElementsByTagName('DistanceMeters');
            const dist = distNode.length > 0 ? parseFloat(distNode[0].textContent) : null;

            // Time
            const timeNode = tp.getElementsByTagName('Time');
            const time = timeNode.length > 0 ? timeNode[0].textContent : null;

            // Heart Rate
            const hrNode = tp.getElementsByTagName('HeartRateBpm');
            const hr = hrNode.length > 0 ? parseInt(hrNode[0].textContent, 10) : null;

            // Cadence
            const cadNode = tp.getElementsByTagName('Cadence');
            const cad = cadNode.length > 0 ? parseFloat(cadNode[0].textContent) : null;

            // Power (extensions)
            let power = null;
            const extensions = tp.getElementsByTagName('Extensions');
            if (extensions.length > 0) {
                const ext = extensions[0];
                const powerNode = ext.getElementsByTagName('Power');
                if (powerNode.length > 0) {
                    power = parseFloat(powerNode[0].textContent);
                } else {
                    // Try TPX1:Watts
                    const tpx = ext.getElementsByTagName('TPX1:Watts');
                    if (tpx.length > 0) {
                        power = parseFloat(tpx[0].textContent);
                    }
                }
            }

            // Speed (extensions)
            let speed = null;
            if (extensions.length > 0) {
                const ext = extensions[0];
                const speedNode = ext.getElementsByTagName('Speed');
                if (speedNode.length > 0) {
                    speed = parseFloat(speedNode[0].textContent);
                }
            }

            if (lat !== null && lon !== null) {
                allPoints.push({
                    lat,
                    lon,
                    ele: alt || 0,
                    time,
                    hr,
                    cadence: cad,
                    power,
                    speed,
                    distance: dist
                });
            }

            // Track elevation stats
            if (alt !== null) {
                minEle = Math.min(minEle, alt);
                maxEle = Math.max(maxEle, alt);
                if (lastEle !== null && alt > lastEle) {
                    totalGain += (alt - lastEle);
                }
                lastEle = alt;
            }

            // Track HR stats
            if (hr !== null) {
                allHR.push(hr);
                maxHR = Math.max(maxHR, hr);
            }
        }
    }

    // Set elevation stats
    activity.elev_high = maxEle !== -Infinity ? maxEle : null;
    activity.elev_low = minEle !== Infinity ? minEle : null;
    activity.total_elevation_gain = Math.round(totalGain);

    // Calculate aggregate stats from laps
    for (const lap of lapData) {
        totalDistance += lap.distance || 0;
        totalTime += lap.elapsed_time || 0;
        totalCalories += lap.calories || 0;
    }

    activity.distance = Math.round(totalDistance);
    activity.moving_time = totalTime;
    activity.elapsed_time = totalTime;
    activity.calories = totalCalories || null;

    // Calculate HR stats
    if (allHR.length > 0) {
        activity.average_heartrate = Math.round(
            allHR.reduce((a, b) => a + b, 0) / allHR.length
        );
        activity.max_heartrate = maxHR;
    }

    // Calculate average cadence
    const allCads = allPoints.map(p => p.cadence).filter(c => c !== null);
    if (allCads.length > 0) {
        activity.average_cadence = Math.round(
            allCads.reduce((a, b) => a + b, 0) / allCads.length
        );
    }

    // Calculate power stats
    const allPowers = allPoints.map(p => p.power).filter(p => p !== null);
    if (allPowers.length > 0) {
        activity.average_power = Math.round(
            allPowers.reduce((a, b) => a + b, 0) / allPowers.length
        );
        activity.max_power = Math.max(...allPowers);
    }

    // Calculate speed stats
    const allSpeeds = allPoints.map(p => p.speed).filter(s => s !== null);
    if (allSpeeds.length > 0) {
        // Convert from m/s to m/s (TCX speed is already in m/s)
        activity.average_speed = Math.round(
            allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length * 100
        ) / 100;
        activity.max_speed = Math.round(
            Math.max(...allSpeeds) * 100
        ) / 100;
    }

    // Extract streams from all points
    const streams = {};
    
    // GPS
    const latlng = allPoints.map(p => [p.lat, p.lon]);
    if (latlng.length > 0) {
        streams.latlng = latlng;
    }

    // Altitude
    const alts = allPoints.map(p => p.ele);
    if (alts.length > 0 && alts.some(a => a !== 0)) {
        streams.altitude = alts;
    }

    // Heart rate
    const hrs = allPoints.map(p => p.hr).filter(h => h !== null);
    if (hrs.length > 0) {
        streams.heartrate = hrs;
    }

    // Cadence
    const cads = allPoints.map(p => p.cadence).filter(c => c !== null);
    if (cads.length > 0) {
        streams.cadence = cads;
    }

    // Power
    const powers = allPoints.map(p => p.power).filter(p => p !== null);
    if (powers.length > 0) {
        streams.power = powers;
    }

    // Speed
    const speeds = allPoints.map(p => p.speed).filter(s => s !== null);
    if (speeds.length > 0) {
        streams.velocity_smooth = speeds;
    }

    if (Object.keys(streams).length > 0) {
        activity._streams = streams;
    }

    // Build polyline
    if (latlng.length > 0) {
        activity.map_polyline = JSON.stringify(latlng);
    }

    // Set splits
    if (lapData.length > 0) {
        activity._splits = lapData;
    }

    // Extract activity name from first lap or use default
    if (!activity.name) {
        const creator = act.getElementsByTagName('Creator');
        if (creator.length > 0) {
            activity.device_name = creator[0].textContent;
            activity.name = `Activity from ${activity.device_name}`;
        } else {
            activity.name = `TCX Activity ${activity.start_date ? new Date(activity.start_date).toLocaleDateString() : ''}`;
        }
    }

    // Extract notes/description
    const notes = act.getElementsByTagName('Notes');
    if (notes.length > 0) {
        activity.notes = notes[0].textContent;
    }

    return activity;
}

/**
 * Parse FIT file (Binary format)
 * Uses fit-file-parser library
 * @param {Buffer|string} content - FIT file content
 * @returns {Promise<ParsedActivity>} Parsed activity
 */
async function parseFIT(content) {
    const FitParser = await getFitParser();
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'binary');

    // Parse the FIT file
    const parser = new FitParser({
        mode: 'both', // Parse both messages and records
        force: true, // Force parsing even with errors
        speedUnit: 'm/s', // Get speed in m/s
        lengthUnit: 'm', // Get length in meters
        temperatureUnit: 'celsius',
        elapsedRecordField: true, // Include elapsed time in records
        modeField: true // Include mode in records
    });

    const fitData = await parser.parse(buffer);

    const activity = {
        source: 'fit',
        source_id: '',
        name: '',
        type: 'run',
        start_date: '',
        distance: 0,
        moving_time: 0,
        elapsed_time: 0,
        total_elevation_gain: 0,
        elev_high: null,
        elev_low: null,
        average_heartrate: null,
        max_heartrate: null,
        average_cadence: null,
        average_power: null,
        max_power: null,
        calories: null,
        map_polyline: null,
        device_name: null,
        _streams: {},
        _splits: []
    };

    // Extract basic info from file
    const fileId = fitData.messages?.file_id?.[0];
    if (fileId) {
        activity.device_name = fileId.manufacturer?.name || null;
        activity.start_date = fileId.time_created ? new Date(fileId.time_created * 1000).toISOString() : '';
    }

    // Extract session info
    const sessions = fitData.messages?.session || [];
    if (sessions.length > 0) {
        const session = sessions[0];
        
        // Set source_id
        if (session.timestamp) {
            activity.source_id = `fit_${new Date(session.timestamp * 1000).toISOString().replace(/[:.]/g, '-')}`;
            activity.start_date = new Date(session.timestamp * 1000).toISOString();
        } else if (fileId?.serial_number) {
            activity.source_id = `fit_${fileId.serial_number}`;
        }

        // Activity type
        if (session.sport) {
            const sportMap = {
                'running': 'run',
                'cycling': 'ride',
                'swimming': 'swim',
                'walking': 'hike',
                'hiking': 'hike',
                'mountain_biking': 'ride',
                'road_biking': 'ride',
                'cyclocross': 'ride',
                'track_cycling': 'ride',
                'indoor_cycling': 'ride',
                'treadmill_running': 'run',
                'indoor_running': 'run'
            };
            activity.type = sportMap[session.sport.toLowerCase()] || session.sport.toLowerCase() || 'run';
        }

        // Basic metrics
        if (session.start_time) {
            const startDate = new Date(session.start_time * 1000);
            activity.start_date = startDate.toISOString();
            if (!activity.source_id) {
                activity.source_id = `fit_${startDate.toISOString().replace(/[:.]/g, '-')}`;
            }
        }

        activity.distance = session.total_distance || 0;
        activity.elapsed_time = session.total_elapsed_time || 0;
        activity.moving_time = session.total_timer_time || session.total_elapsed_time || 0;
        activity.calories = session.total_calories || null;

        // Elevation
        activity.elev_high = session.total_ascent ? null : session.total_ascent; // Will recalc from records
        activity.elev_low = session.total_descent ? null : session.total_descent;
        activity.total_elevation_gain = session.total_ascent || 0;

        // HR
        activity.average_heartrate = session.avg_heart_rate || null;
        activity.max_heartrate = session.max_heart_rate || null;

        // Cadence
        activity.average_cadence = session.avg_cadence || null;

        // Power
        activity.average_power = session.avg_power || null;
        activity.max_power = session.max_power || null;
    }

    // Extract laps
    const laps = fitData.messages?.lap || [];
    const lapData = [];
    
    for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const lapObj = {
            split_number: i + 1,
            distance: lap.total_distance || 0,
            elapsed_time: lap.total_elapsed_time || 0,
            moving_time: lap.total_timer_time || lap.total_elapsed_time || 0,
            average_heartrate: lap.avg_heart_rate || null,
            max_heartrate: lap.max_heart_rate || null,
            average_speed: lap.avg_speed || null,
            max_speed: lap.max_speed || null,
            average_power: lap.avg_power || null,
            max_power: lap.max_power || null,
            elevation_difference: null,
            pace_zone: lap.intensity || null,
            calories: lap.total_calories || null
        };

        // Calculate elevation difference from records in this lap
        if (fitData.records && Array.isArray(fitData.records)) {
            const lapRecords = fitData.records.filter(r => r.lap === i);
            if (lapRecords.length >= 2) {
                const first = lapRecords[0];
                const last = lapRecords[lapRecords.length - 1];
                if (first.altitude !== undefined && last.altitude !== undefined) {
                    lapObj.elevation_difference = last.altitude - first.altitude;
                }
            }
        }

        lapData.push(lapObj);
    }

    if (lapData.length > 0) {
        activity._splits = lapData;
    }

    // Extract records (trackpoints) for streams
    const records = fitData.records || [];
    
    if (records.length > 0) {
        const streams = {};
        const latlng = [];
        const alts = [];
        const hrs = [];
        const cads = [];
        const powers = [];
        const speeds = [];
        const distances = [];
        const times = [];

        let minEle = Infinity;
        let maxEle = -Infinity;
        let lastEle = null;
        let totalGain = 0;

        for (const record of records) {
            // Position
            if (record.position_lat !== undefined && record.position_long !== undefined) {
                latlng.push([record.position_lat, record.position_long]);
            }

            // Altitude
            if (record.altitude !== undefined) {
                alts.push(record.altitude);
                minEle = Math.min(minEle, record.altitude);
                maxEle = Math.max(maxEle, record.altitude);
                if (lastEle !== null && record.altitude > lastEle) {
                    totalGain += (record.altitude - lastEle);
                }
                lastEle = record.altitude;
            }

            // Heart rate
            if (record.heart_rate !== undefined) {
                hrs.push(record.heart_rate);
            }

            // Cadence
            if (record.cadence !== undefined) {
                cads.push(record.cadence);
            }

            // Power
            if (record.power !== undefined) {
                powers.push(record.power);
            }

            // Speed
            if (record.speed !== undefined) {
                speeds.push(record.speed);
            }

            // Distance
            if (record.distance !== undefined) {
                distances.push(record.distance);
            }

            // Time
            if (record.timestamp !== undefined) {
                times.push(record.timestamp);
            }
        }

        // Update elevation stats from records (more accurate)
        if (alts.length > 0) {
            activity.elev_high = Math.max(...alts.filter(a => !isNaN(a)));
            activity.elev_low = Math.min(...alts.filter(a => !isNaN(a)));
            activity.total_elevation_gain = Math.round(totalGain);
            streams.altitude = alts;
        }

        // Calculate time range
        if (times.length >= 2) {
            const startTime = new Date(times[0] * 1000);
            const endTime = new Date(times[times.length - 1] * 1000);
            const elapsedSecs = (endTime - startTime) / 1000;
            
            if (activity.elapsed_time === 0) {
                activity.elapsed_time = Math.round(elapsedSecs);
            }
            if (activity.moving_time === 0) {
                activity.moving_time = Math.round(elapsedSecs);
            }
            
            if (!activity.start_date) {
                activity.start_date = startTime.toISOString();
            }
        }

        // Build streams
        if (latlng.length > 0) {
            streams.latlng = latlng;
        }
        if (hrs.length > 0) {
            streams.heartrate = hrs;
            // Recalculate HR stats
            activity.average_heartrate = Math.round(
                hrs.reduce((a, b) => a + b, 0) / hrs.length
            );
            activity.max_heartrate = Math.max(...hrs);
        }
        if (cads.length > 0) {
            streams.cadence = cads;
            activity.average_cadence = Math.round(
                cads.reduce((a, b) => a + b, 0) / cads.length
            );
        }
        if (powers.length > 0) {
            streams.power = powers;
            activity.average_power = Math.round(
                powers.reduce((a, b) => a + b, 0) / powers.length
            );
            activity.max_power = Math.max(...powers);
        }
        if (speeds.length > 0) {
            streams.velocity_smooth = speeds;
            activity.average_speed = Math.round(
                speeds.reduce((a, b) => a + b, 0) / speeds.length * 100
            ) / 100;
            activity.max_speed = Math.round(
                Math.max(...speeds) * 100
            ) / 100;
        }
        if (distances.length > 0) {
            streams.distance = distances;
            // Update distance from last record
            if (distances[distances.length - 1] > activity.distance) {
                activity.distance = distances[distances.length - 1];
            }
        }

        if (Object.keys(streams).length > 0) {
            activity._streams = streams;
        }
    }

    // Build polyline from streams or laps
    if (activity._streams?.latlng) {
        activity.map_polyline = JSON.stringify(activity._streams.latlng);
    } else if (activity._splits?.length > 0 && activity._splits[0].distance > 0) {
        // Fallback: create simple polyline from distance (not ideal, but better than nothing)
        activity.map_polyline = JSON.stringify([]);
    }

    // Set name from device or default
    if (!activity.name) {
        if (activity.device_name) {
            activity.name = `Activity from ${activity.device_name}`;
        } else if (activity.start_date) {
            activity.name = `FIT Activity ${new Date(activity.start_date).toLocaleDateString()}`;
        } else {
            activity.name = `FIT Activity`;
        }
    }

    return activity;
}

/**
 * Haversine formula to calculate distance between two points in meters
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
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

/**
 * Helper to parse float from XML node
 * @param {Object} parent - Parent XML element
 * @param {string} tagName - Tag name to find
 * @returns {number|null} Parsed float or null
 */
function parseFloatNode(parent, tagName) {
    const nodes = parent.getElementsByTagName(tagName);
    if (nodes.length > 0) {
        const val = parseFloat(nodes[0].textContent);
        return isNaN(val) ? null : val;
    }
    return null;
}

/**
 * Helper to parse int from XML node
 * @param {Object} parent - Parent XML element
 * @param {string} tagName - Tag name to find
 * @returns {number|null} Parsed int or null
 */
function parseIntNode(parent, tagName) {
    const nodes = parent.getElementsByTagName(tagName);
    if (nodes.length > 0) {
        const val = parseInt(nodes[0].textContent, 10);
        return isNaN(val) ? null : val;
    }
    return null;
}

/**
 * Parse Polar CSV file
 * Polar exports CSV with columns like: Time, Heart Rate, Speed, Cadence, Altitude, etc.
 * @param {string|Buffer} content - CSV content
 * @param {string} filename - Original filename (for source_id)
 * @returns {ParsedActivity} Parsed activity
 */
function parsePolarCSV(content, filename) {
    const csvString = Buffer.isBuffer(content) ? content.toString('utf8') : content;

    const activity = {
        source: 'polar_csv',
        source_id: '',
        name: '',
        type: 'run',
        start_date: '',
        distance: 0,
        moving_time: 0,
        elapsed_time: 0,
        total_elevation_gain: 0,
        elev_high: null,
        elev_low: null,
        average_heartrate: null,
        max_heartrate: null,
        average_cadence: null,
        average_power: null,
        max_power: null,
        calories: null,
        map_polyline: null,
        device_name: 'Polar',
        _streams: {},
        _splits: []
    };

    // Set source_id from filename
    if (filename) {
        activity.source_id = `polar_csv_${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        // Try to extract date from filename (e.g., "2024-01-15_10-30-00.csv")
        const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            activity.name = `Polar Activity ${dateMatch[1]}`;
        } else {
            activity.name = `Polar Activity ${filename.split('.')[0]}`;
        }
    } else {
        activity.source_id = `polar_csv_${Date.now()}`;
        activity.name = 'Polar Activity';
    }

    // Parse CSV lines
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        logger.warn('[ActivityParser] Polar CSV has insufficient data');
        return null;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // Normalize header names
    const headerMap = {};
    headers.forEach((h, i) => {
        const normalized = h.toLowerCase().trim();
        headerMap[normalized] = i;
    });

    // Expected columns (case insensitive)
    const COL_MAP = {
        time: ['time', 'timestamp', 'date', 'datetime'],
        heartrate: ['heart rate', 'heart_rate', 'hr', 'heartrate'],
        speed: ['speed', 'velocity', 'pace'],
        cadence: ['cadence', 'rpm'],
        altitude: ['altitude', 'elevation', 'ele'],
        distance: ['distance', 'dist'],
        power: ['power', 'watts', 'watt'],
        latitude: ['latitude', 'lat'],
        longitude: ['longitude', 'lon', 'lng'],
    };

    // Find column indices
    const colIndices = {};
    Object.entries(COL_MAP).forEach(([key, variants]) => {
        for (const variant of variants) {
            if (headerMap[variant] !== undefined) {
                colIndices[key] = headerMap[variant];
                break;
            }
        }
    });

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;
        rows.push(values);
    }

    if (rows.length === 0) {
        logger.warn('[ActivityParser] No data rows in Polar CSV');
        return null;
    }

    // Extract data from rows
    const times = [];
    const hrs = [];
    const cads = [];
    const speeds = [];
    const alts = [];
    const distances = [];
    const powers = [];
    const lats = [];
    const lngs = [];
    const latlng = [];

    let minEle = Infinity;
    let maxEle = -Infinity;
    let lastEle = null;
    let totalGain = 0;
    let startTime = null;
    let endTime = null;
    let totalDistance = 0;

    for (const row of rows) {
        // Time
        if (colIndices.time !== undefined) {
            const timeStr = row[colIndices.time].trim();
            if (timeStr) {
                times.push(timeStr);
                const date = parsePolarTime(timeStr);
                if (date) {
                    if (!startTime || date < startTime) startTime = date;
                    if (!endTime || date > endTime) endTime = date;
                }
            }
        }

        // Heart Rate
        if (colIndices.heartrate !== undefined) {
            const hr = parseFloat(row[colIndices.heartrate]);
            if (!isNaN(hr)) {
                hrs.push(hr);
            }
        }

        // Cadence
        if (colIndices.cadence !== undefined) {
            const cad = parseFloat(row[colIndices.cadence]);
            if (!isNaN(cad)) {
                cads.push(cad);
            }
        }

        // Speed (convert to m/s if needed)
        if (colIndices.speed !== undefined) {
            let speed = parseFloat(row[colIndices.speed]);
            if (!isNaN(speed)) {
                // Assume km/h, convert to m/s
                if (speed > 10) speed = speed / 3.6;
                speeds.push(speed);
            }
        }

        // Altitude
        if (colIndices.altitude !== undefined) {
            const alt = parseFloat(row[colIndices.altitude]);
            if (!isNaN(alt)) {
                alts.push(alt);
                minEle = Math.min(minEle, alt);
                maxEle = Math.max(maxEle, alt);
                if (lastEle !== null && alt > lastEle) {
                    totalGain += (alt - lastEle);
                }
                lastEle = alt;
            }
        }

        // Distance
        if (colIndices.distance !== undefined) {
            const dist = parseFloat(row[colIndices.distance]);
            if (!isNaN(dist)) {
                distances.push(dist);
            }
        }

        // Power
        if (colIndices.power !== undefined) {
            const power = parseFloat(row[colIndices.power]);
            if (!isNaN(power)) {
                powers.push(power);
            }
        }

        // GPS coordinates
        if (colIndices.latitude !== undefined && colIndices.longitude !== undefined) {
            const lat = parseFloat(row[colIndices.latitude]);
            const lon = parseFloat(row[colIndices.longitude]);
            if (!isNaN(lat) && !isNaN(lon)) {
                lats.push(lat);
                lngs.push(lon);
                latlng.push([lat, lon]);
            }
        }
    }

    // Set dates
    if (startTime) {
        activity.start_date = startTime.toISOString();
        if (!activity.source_id.includes(Date.now())) {
            activity.source_id = activity.source_id.replace(Date.now(), startTime.toISOString().replace(/[:.]/g, '-'));
        }
    }

    // Calculate durations
    if (startTime && endTime) {
        activity.elapsed_time = Math.round((endTime - startTime) / 1000);
        activity.moving_time = activity.elapsed_time;
    } else if (times.length >= 2) {
        // Fallback: assume 1 second between rows
        activity.elapsed_time = rows.length - 1;
        activity.moving_time = activity.elapsed_time;
    }

    // Set elevation stats
    activity.elev_high = minEle !== Infinity ? Math.round(minEle) : null;
    activity.elev_low = maxEle !== Infinity ? Math.round(maxEle) : null;
    activity.total_elevation_gain = Math.round(totalGain);

    // Set distance from last value
    if (distances.length > 0) {
        activity.distance = Math.round(distances[distances.length - 1]);
    } else if (speeds.length > 0 && activity.moving_time > 0) {
        // Calculate distance from speed * time
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        activity.distance = Math.round(avgSpeed * activity.moving_time);
    }

    // Set HR stats
    if (hrs.length > 0) {
        activity.average_heartrate = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
        activity.max_heartrate = Math.max(...hrs);
    }

    // Set cadence stats
    if (cads.length > 0) {
        activity.average_cadence = Math.round(cads.reduce((a, b) => a + b, 0) / cads.length);
    }

    // Set power stats
    if (powers.length > 0) {
        activity.average_power = Math.round(powers.reduce((a, b) => a + b, 0) / powers.length);
        activity.max_power = Math.max(...powers);
    }

    // Set speed stats
    if (speeds.length > 0) {
        activity.average_speed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 100) / 100;
        activity.max_speed = Math.round(Math.max(...speeds) * 100) / 100;
    }

    // Build streams
    if (latlng.length > 0) {
        activity._streams.latlng = latlng;
        activity.map_polyline = JSON.stringify(latlng);
    }
    if (hrs.length > 0) activity._streams.heartrate = hrs;
    if (cads.length > 0) activity._streams.cadence = cads;
    if (speeds.length > 0) activity._streams.velocity_smooth = speeds;
    if (alts.length > 0) activity._streams.altitude = alts;
    if (distances.length > 0) activity._streams.distance = distances;
    if (powers.length > 0) activity._streams.power = powers;

    return activity;
}

/**
 * Parse a single CSV line
 * @param {string} line - CSV line
 * @returns {string[]} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

/**
 * Parse Polar time string (various formats)
 * @param {string} timeStr - Time string
 * @returns {Date|null} Parsed date or null
 */
function parsePolarTime(timeStr) {
    if (!timeStr) return null;

    // Try ISO format first
    const isoDate = Date.parse(timeStr);
    if (!isNaN(isoDate)) return new Date(isoDate);

    // Try common Polar formats
    // Format: "2024-01-15 10:30:00" or "2024-01-15T10:30:00"
    const formats = [
        'yyyy-mm-dd HH:MM:ss',
        'yyyy-mm-ddTHH:MM:ss',
        'mm:ss',
        'HH:mm:ss',
    ];

    for (const format of formats) {
        try {
            // Simple manual parsing for common formats
            if (format === 'yyyy-mm-dd HH:MM:ss') {
                const match = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
                if (match) {
                    return new Date(
                        parseInt(match[1]),
                        parseInt(match[2]) - 1,
                        parseInt(match[3]),
                        parseInt(match[4]),
                        parseInt(match[5]),
                        parseInt(match[6])
                    );
                }
            }
            if (format === 'yyyy-mm-ddTHH:MM:ss') {
                const match = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
                if (match) {
                    return new Date(
                        parseInt(match[1]),
                        parseInt(match[2]) - 1,
                        parseInt(match[3]),
                        parseInt(match[4]),
                        parseInt(match[5]),
                        parseInt(match[6])
                    );
                }
            }
        } catch (e) {
            // Continue to next format
        }
    }

    return null;
}

/**
 * Parse a ZIP file containing a single activity (FIT or GPX)
 * @param {Buffer|string} content - ZIP file content
 * @param {string} filename - Original filename
 * @returns {Promise<ParsedActivity|null>} Parsed activity
 */
async function parseZipSingle(content, filename) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'binary');

    // For now, just extract the first FIT or GPX file from the ZIP
    // Full Strava ZIP parsing is done in parseStravaZip
    try {
        // Try to find and extract first activity file
        const entries = [];
        
        // Simple ZIP parsing - look for file signatures
        // This is a simplified approach; for production, use yauzl or similar
        const str = buffer.toString('binary');
        
        // Look for .fit or .gpx files in the ZIP
        const fitMatch = str.match(/(\x50\x4B\x03\x04[\s\S]*?\.fit)/i);
        const gpxMatch = str.match(/(\x50\x4B\x03\x04[\s\S]*?\.gpx)/i);
        const tcxMatch = str.match(/(\x50\x4B\x03\x04[\s\S]*?\.tcx)/i);

        if (fitMatch) {
            // Extract FIT file from ZIP
            // This is a simplified approach - in production, use a proper ZIP library
            const fitStart = fitMatch.index + fitMatch[0].lastIndexOf('\x50\x4B\x03\x04');
            const nextSignature = str.indexOf('\x50\x4B\x01\x02', fitStart + 4);
            const fitEnd = nextSignature !== -1 ? nextSignature : buffer.length;
            const fitBuffer = buffer.slice(fitStart, fitEnd);
            return await parseFIT(fitBuffer);
        }

        if (gpxMatch) {
            const gpxStart = gpxMatch.index + gpxMatch[0].lastIndexOf('\x50\x4B\x03\x04');
            const nextSignature = str.indexOf('\x50\x4B\x01\x02', gpxStart + 4);
            const gpxEnd = nextSignature !== -1 ? nextSignature : buffer.length;
            const gpxBuffer = buffer.slice(gpxStart, gpxEnd);
            return parseGPX(gpxBuffer);
        }

        if (tcxMatch) {
            const tcxStart = tcxMatch.index + tcxMatch[0].lastIndexOf('\x50\x4B\x03\x04');
            const nextSignature = str.indexOf('\x50\x4B\x01\x02', tcxStart + 4);
            const tcxEnd = nextSignature !== -1 ? nextSignature : buffer.length;
            const tcxBuffer = buffer.slice(tcxStart, tcxEnd);
            return parseTCX(tcxBuffer);
        }

        logger.warn('[ActivityParser] No activity file found in ZIP');
        return null;
    } catch (error) {
        logger.error('[ActivityParser] Failed to parse ZIP single', { error: error.message });
        return null;
    }
}

/**
 * Parse Strava ZIP bulk export
 * Strava export format: ZIP containing activities/ folder with .fit.gz and .gpx.gz files
 * @param {Buffer|string} content - ZIP file content
 * @param {string} filename - Original filename
 * @returns {Promise<ParsedActivity[]|null>} Array of parsed activities
 */
async function parseStravaZip(content, filename) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'binary');

    const activities = [];

    try {
        // Simple ZIP parsing to find activity files
        // In production, consider using 'yauzl' or 'adm-zip' for proper ZIP handling
        const str = buffer.toString('binary');

        // Find all .fit.gz, .gpx.gz, .fit, .gpx, .tcx files
        const fileSignatures = [
            { ext: 'fit.gz', signature: Buffer.from([0x1f, 0x8b]) }, // gzip signature
            { ext: 'gpx.gz', signature: Buffer.from([0x1f, 0x8b]) },
            { ext: 'fit', signature: Buffer.from([0x12]) },
            { ext: 'gpx', signature: Buffer.from('<?xml') },
            { ext: 'tcx', signature: Buffer.from('<?xml') },
        ];

        // Look for activities/ folder entries
        const activitiesFolderPrefix = 'activities/';
        let pos = 0;

        while (pos < buffer.length - 30) {
            // Look for ZIP local file header (PK\x03\x04)
            if (buffer[pos] === 0x50 && buffer[pos + 1] === 0x4B && 
                buffer[pos + 2] === 0x03 && buffer[pos + 3] === 0x04) {

                // Skip to filename length (26 bytes in)
                const filenameLength = buffer.readUInt16LE(pos + 26);
                const extraFieldLength = buffer.readUInt16LE(pos + 28);
                const filenameStart = pos + 30 + filenameLength + extraFieldLength;

                // Read filename
                const zipFilename = buffer.toString('utf8', pos + 30, pos + 30 + filenameLength);

                // Check if this is an activity file
                if (zipFilename.includes(activitiesFolderPrefix) && 
                    (zipFilename.endsWith('.fit.gz') || 
                     zipFilename.endsWith('.gpx.gz') ||
                     zipFilename.endsWith('.fit') ||
                     zipFilename.endsWith('.gpx') ||
                     zipFilename.endsWith('.tcx'))) {

                    // Extract file content
                    const compressedSize = buffer.readUInt32LE(pos + 18);
                    const fileDataStart = filenameStart + extraFieldLength;
                    const fileDataEnd = fileDataStart + compressedSize;
                    const fileBuffer = buffer.slice(fileDataStart, fileDataEnd);

                    // Decompress if gzipped
                    let decompressed = fileBuffer;
                    if (zipFilename.endsWith('.gz')) {
                        try {
                            // Simple gzip decompression would go here
                            // For now, skip gzipped files or use sync request
                            logger.warn('[ActivityParser] Gzipped file in ZIP - use external decompressor');
                            pos = fileDataEnd;
                            continue;
                        } catch (e) {
                            logger.warn('[ActivityParser] Failed to decompress', { filename: zipFilename, error: e.message });
                            pos = fileDataEnd;
                            continue;
                        }
                    }

                    // Parse based on extension
                    let parsed = null;
                    if (zipFilename.endsWith('.fit')) {
                        parsed = await parseFIT(decompressed);
                    } else if (zipFilename.endsWith('.gpx')) {
                        parsed = parseGPX(decompressed);
                    } else if (zipFilename.endsWith('.tcx')) {
                        parsed = parseTCX(decompressed);
                    }

                    if (parsed) {
                        // Set source info
                        parsed.source = 'strava_zip';
                        parsed.source_id = `strava_${zipFilename.replace(/[^a-zA-Z0-9]/g, '_')}`;
                        parsed.name = zipFilename.split('/').pop().replace('.fit', '').replace('.gpx', '').replace('.tcx', '');
                        activities.push(parsed);
                    }
                }

                // Move to next entry
                const compressedSize = buffer.readUInt32LE(pos + 18);
                const headerSize = 30 + filenameLength + extraFieldLength;
                pos = pos + headerSize + compressedSize;
            } else {
                pos++;
            }
        }

        logger.info(`[ActivityParser] Extracted ${activities.length} activities from Strava ZIP`);
        return activities.length > 0 ? activities : null;
    } catch (error) {
        logger.error('[ActivityParser] Failed to parse Strava ZIP', {
            error: error.message,
            stack: error.stack
        });
        return null;
    }
}

/**
 * Parse a directory of files (for bulk imports)
 * @param {string} dirPath - Directory path
 * @param {Object} [options] - Options
 * @returns {Promise<ParsedActivity[]>} Array of parsed activities
 */
async function parseActivityDirectory(dirPath, options = {}) {
    const activities = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
            const content = fs.readFileSync(filePath);
            const parsed = await parseActivityFile(file, content, options);

            if (parsed) {
                if (Array.isArray(parsed)) {
                    activities.push(...parsed);
                } else {
                    activities.push(parsed);
                }
            }
        }
    }

    return activities;
}

module.exports = {
    detectFormat,
    parseActivityFile,
    parseGPX,
    parseTCX,
    parseFIT,
    parsePolarCSV,
    parseStravaZip,
    parseZipSingle,
    parseActivityDirectory,
    haversineDistance
};
