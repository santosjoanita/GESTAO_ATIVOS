const express = require('express');
const router = express.Router();
const gestaoController = require('../controllers/gestaoController');
const { verifyToken, checkPermission } = require('../middleware/authMiddleware'); 

// Dashboard Stats
router.get('/dashboard', verifyToken, checkPermission('ver_dashboard'), gestaoController.getDashboardStats);

// Histórico Stock -
router.get('/stock/historico', verifyToken, gestaoController.getHistoricoStock);

// Notificações de Prazos
router.get('/notificacoes/prazos', verifyToken, gestaoController.getNotificacoesPrazos);
router.get('/notificacoes/prazos/:id', verifyToken, gestaoController.getNotificacoesPrazos);

// Atualizar Estados
router.put('/:tipo/:id/estado', verifyToken, checkPermission('aprovar_requisicoes'), gestaoController.atualizarEstado);

module.exports = router;