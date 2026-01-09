const express = require('express');
const router = express.Router();
const gestaoController = require('../controllers/gestaoController');
const dashboardController = require('../controllers/dashboardController');
const requisicoesController = require('../controllers/requisicoesController');
const eventosController = require('../controllers/eventosController');

const { checkPermission } = require('../middleware/authMiddleware.js');
const { Permissions } = require('../auth/acl');

// Listagens para o Dashboard 
router.get('/requisicoes/todas', 
    checkPermission(Permissions.VIEW_DASHBOARD), 
    requisicoesController.listarTodas
);

router.get('/eventos/todos', 
    checkPermission(Permissions.VIEW_DASHBOARD), 
    eventosController.listarTodos
);

// Estados (Aprovar/Rejeitar)
router.put('/:tipo/:id/estado', 
    checkPermission(Permissions.MANAGE_SISTEMA), 
    gestaoController.atualizarEstado
);

// Dashboard / Notificações
router.get('/notificacoes/prazos/:id', 
    checkPermission(Permissions.VIEW_DASHBOARD), 
    dashboardController.notificacoesPrazos
);

// Histórico de Stock
router.get('/stock/historico', 
    checkPermission(Permissions.VIEW_STOCK), 
    dashboardController.historicoStock);

module.exports = router;