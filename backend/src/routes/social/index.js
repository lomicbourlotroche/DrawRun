'use strict';
const router = require('express').Router();

router.use(require('./friends'));
router.use(require('./groups'));
router.use(require('./feed'));
router.use(require('./engagement'));
router.use(require('./notifications'));
router.use(require('./conversations'));
router.use(require('./challenges'));
router.use(require('./badges-xp'));

module.exports = router;
