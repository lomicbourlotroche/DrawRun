/* eslint-disable */
'use strict';

const express = require('express');
const router = express.Router();
const { dbAllUser, dbRunUser, dbGetUser, getUserDb } = require('../database');
const { logger } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

// Toutes les routes gear nécessitent auth
router.use(verifyToken);

/**
 * GET /api/gear
 * List all gear for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const gear = await dbAllUser(userDb, 'SELECT * FROM gear ORDER BY is_active DESC, name ASC');
        res.json(gear);
    } catch (error) {
        logger.error('Error fetching gear:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du matériel' });
    }
});

/**
 * POST /api/gear
 * Add new gear
 */
router.post('/', async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const userId = req.user.id;
        const { name, brand, model, type, purchase_date, initial_distance = 0, max_distance = 800 } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Nom et type requis' });
        }

        const result = await dbRunUser(userDb, `
            INSERT INTO gear (name, brand, model, type, purchased_at, distance_km, max_distance_km, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, brand, model, type, purchase_date, initial_distance, max_distance]);

        res.status(201).json({ id: result.id, message: 'Matériel ajouté avec succès' });
    } catch (error) {
        logger.error('Error adding gear:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du matériel' });
    }
});

/**
 * PUT /api/gear/:id
 * Update gear
 */
router.put('/:id', async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const userId = req.user.id;
        const gearId = req.params.id;
        const { name, brand, model, type, max_distance, is_active, initial_distance } = req.body;

        const gear = await dbGetUser(userDb, 'SELECT * FROM gear WHERE id = ?', [gearId]);
        if (!gear) {
            return res.status(404).json({ error: 'Matériel non trouvé' });
        }

        await dbRunUser(userDb, `
            UPDATE gear 
            SET name = ?, brand = ?, model = ?, type = ?, max_distance_km = ?, is_active = ?, distance_km = COALESCE(?, distance_km)
            WHERE id = ?
        `, [
            name || gear.name, 
            brand || gear.brand, 
            model || gear.model, 
            type || gear.type, 
            max_distance !== undefined ? max_distance : gear.max_distance_km,
            is_active !== undefined ? is_active : gear.is_active,
            initial_distance,
            gearId
        ]);

        res.json({ message: 'Matériel mis à jour' });
    } catch (error) {
        logger.error('Error updating gear:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du matériel' });
    }
});

/**
 * DELETE /api/gear/:id
 * Delete gear (only if no activities linked, otherwise deactivate)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const userId = req.user.id;
        const gearId = req.params.id;

        // Check if gear is used in any activity
        const used = await dbGetUser(userDb, 'SELECT id FROM activities WHERE gear_id = ? LIMIT 1', [gearId]);
        
        if (used) {
            // Just deactivate
            await dbRunUser(userDb, 'UPDATE gear SET is_active = 0 WHERE id = ?', [gearId]);
            return res.json({ message: 'Matériel archivé car utilisé dans des activités' });
        }

        await dbRunUser(userDb, 'DELETE FROM gear WHERE id = ?', [gearId]);
        res.json({ message: 'Matériel supprimé' });
    } catch (error) {
        logger.error('Error deleting gear:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

module.exports = router;
