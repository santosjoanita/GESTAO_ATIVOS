const express = require('express');
const router = express.Router();
const requisicoesController = require('../controllers/requisicoesController');

const { verifyToken } = require('../middleware/authMiddleware'); 

// Rotas de Leitura
router.get('/eventos-disponiveis', verifyToken, requisicoesController.listarEventosDisponiveis);
router.get('/:id/materiais', verifyToken, requisicoesController.listarMateriais);
router.get('/user/:id', verifyToken, requisicoesController.listarPorUser);
router.get('/todas', verifyToken, requisicoesController.listarTodas); 
router.get('/historico', verifyToken, requisicoesController.getHistoricoGeral); 

// Rotas de Escrita
router.post('/', verifyToken, requisicoesController.criar); 
router.post('/:id/submeter', verifyToken, requisicoesController.submeterMateriais);

// Rota para mudar estado (Devolver / Cancelar / Aprovar)
router.put('/:id/estado', verifyToken, requisicoesController.atualizarEstado);
router.put('/:id/devolver', verifyToken, requisicoesController.devolverRequisicao);
router.put('/:id/cancelar', verifyToken, requisicoesController.cancelarRequisicao);

module.exports = router;