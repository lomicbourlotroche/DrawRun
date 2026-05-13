'use strict';

 function parseGpx(xml) {
     const getTag = (str, tag) => {
         // eslint-disable-next-line security/detect-non-literal-regexp
         const m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
         return m ? m[1].trim() : null;
     };
     const getAttr = (str, attr) => {
         // eslint-disable-next-line security/detect-non-literal-regexp
         const m = str.match(new RegExp(`${attr}="([^"]+)"`));
         return m ? m[1] : null;
     };
    const trkpts = [];
    const trkptRe = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
    let m;
    while ((m = trkptRe.exec(xml)) !== null) {
        const attrs = m[1];
        const content = m[2];
        const lat = parseFloat(getAttr(attrs, 'lat'));
        const lon = parseFloat(getAttr(attrs, 'lon'));
        const ele = parseFloat(getTag(content, 'ele') || '0');
        const timeStr = getTag(content, 'time');
        const hr = getTag(content, 'gpxtpx:hr') || getTag(content, 'ns3:hr') || getTag(content, 'hr');
        const cad = getTag(content, 'gpxtpx:cad') || getTag(content, 'ns3:cad') || getTag(content, 'cad');
        if (!isNaN(lat) && !isNaN(lon)) {
            trkpts.push({ lat, lon, ele, time: timeStr ? new Date(timeStr) : null, hr: hr ? parseInt(hr) : null, cad: cad ? parseInt(cad) : null });
        }
    }
    if (trkpts.length < 2) return null;

    let totalDist = 0;
    let elevGain = 0;
    let elevLoss = 0;
    let minEle = trkpts[0].ele;
    let maxEle = trkpts[0].ele;
    const latlng = [[trkpts[0].lat, trkpts[0].lon]];
    const hrArr = [];
    const altArr = [trkpts[0].ele];
    const cadArr = [];
    const distArr = [0];
    const timeArr = [0];

     /* eslint-disable security/detect-object-injection */
     for (let i = 1; i < trkpts.length; i++) {
         const p1 = trkpts[i - 1], p2 = trkpts[i];
         const R = 6371000;
         const dLat = (p2.lat - p1.lat) * Math.PI / 180;
         const dLon = (p2.lon - p1.lon) * Math.PI / 180;
         const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
             Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
         const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
         totalDist += d;
         distArr.push(Math.round(totalDist));
         latlng.push([p2.lat, p2.lon]);
         altArr.push(p2.ele);
         if (p2.ele > p1.ele) elevGain += p2.ele - p1.ele;
         else if (p2.ele < p1.ele) elevLoss += p1.ele - p2.ele;
         if (p2.ele < minEle) minEle = p2.ele;
         if (p2.ele > maxEle) maxEle = p2.ele;
         if (p2.hr) hrArr.push(p2.hr);
         if (p2.cad) cadArr.push(p2.cad);
         if (p1.time && p2.time) {
             timeArr.push(Math.round((p2.time - trkpts[0].time) / 1000));
         } else {
             timeArr.push(i);
         }
     }
      /* eslint-enable security/detect-object-injection */

     const duration = trkpts[0].time && trkpts[trkpts.length - 1].time
        ? Math.round((trkpts[trkpts.length - 1].time - trkpts[0].time) / 1000)
        : trkpts.length;

    const avgHR = hrArr.length ? Math.round(hrArr.reduce((a, b) => a + b, 0) / hrArr.length) : null;
    const maxHR = hrArr.length ? Math.max(...hrArr) : null;
    const avgSpeed = duration > 0 ? (totalDist / duration) : 0;

    return {
        distance: Math.round(totalDist),
        duration,
        elevGain: Math.round(elevGain),
        elevLoss: Math.round(elevLoss),
        elevMin: Math.round(minEle),
        elevMax: Math.round(maxEle),
        avgHR,
        maxHR,
        avgSpeed,
        startDate: trkpts[0].time ? trkpts[0].time.toISOString() : new Date().toISOString(),
        streams: { latlng, distance: distArr, time: timeArr, altitude: altArr, heartrate: hrArr, cadence: cadArr },
        mapPolyline: JSON.stringify(latlng),
    };
}

module.exports = { parseGpx };
