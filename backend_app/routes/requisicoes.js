const express = require('express');
const router = express.Router();
const requisicoesController = require('../controllers/requisicoesController');

router.post('/', requisicoesController.criar);
router.get('/user/:id', requisicoesController.listarPorUser);
router.get('/todas', requisicoesController.listarTodas); 

module.exports = router;