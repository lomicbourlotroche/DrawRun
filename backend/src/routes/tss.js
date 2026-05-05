/**
 * ============================================================
 * TSS ROUTES
 * ============================================================
 * Training Stress Score calculator
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const tss = require('../tss_calculator');

const router = express.Router();

// POST /api/tss/calculate
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const { duration, avgHR, thresholdHR, maxHR } = req.body;
        const tssValue = tss.calculateTSS(duration, avgHR, thresholdHR, maxHR);
        res.json({ tss: tssValue });
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate TSS' });
    }
});

module.exports = router;
