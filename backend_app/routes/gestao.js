const express = require('express');
const router = express.Router();
const gestaoController = require('../controllers/gestaoController');
const dashboardController = require('../controllers/dashboardController');

// Estados
router.put('/:tipo/:id/estado', gestaoController.atualizarEstado);

// Dashboard / Notificações
router.get('/notificacoes/prazos/:id', dashboardController.notificacoesPrazos);
router.get('/stock/historico', dashboardController.historicoStock);

module.exports = router;