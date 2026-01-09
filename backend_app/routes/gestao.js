const express = require('express');
const router = express.Router();
const gestaoController = require('../controllers/gestaoController');
const dashboardController = require('../controllers/dashboardController');
const requisicoesController = require('../controllers/requisicoesController');
const eventosController = require('../controllers/eventosController');

// Listagens para o Dashboard
router.get('/requisicoes/todas', requisicoesController.listarTodas);
router.get('/eventos/todos', eventosController.listarTodos);

// Estados (Aprovar/Rejeitar)
router.put('/:tipo/:id/estado', gestaoController.atualizarEstado);

// Dashboard / Notificações
router.get('/notificacoes/prazos/:id', dashboardController.notificacoesPrazos);
router.get('/stock/historico', dashboardController.historicoStock);

module.exports = router;