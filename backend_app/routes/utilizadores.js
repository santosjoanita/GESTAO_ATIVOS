const express = require('express');
const router = express.Router();

const utilizadoresController = require('../controllers/utilizadoresController');
const eventosController = require('../controllers/eventosController');
const requisicoesController = require('../controllers/requisicoesController');

const authMiddleware = require('../middleware/authMiddleware');
const verifyToken = authMiddleware.verifyToken; 

console.log("Verificação Final Middleware:", typeof verifyToken);

// Rotas de Admin
router.get('/admin/eventos', verifyToken, (req, res) => {
    if (eventosController.listarTodosGeral) {
        eventosController.listarTodosGeral(req, res);
    } else {
        res.status(500).send("Erro: listarTodosGeral não definido");
    }
});

router.get('/admin/requisicoes', verifyToken, (req, res) => {
    if (requisicoesController.listarTodasGeral) {
        requisicoesController.listarTodasGeral(req, res);
    } else {
        res.status(500).send("Erro: listarTodasGeral não definido");
    }
});

// Rotas de Gestão de Utilizadores
router.put('/:id/perfil', verifyToken, (req, res) => {
    utilizadoresController.alterarPerfil(req, res);
});

router.put('/:id/estado', verifyToken, (req, res) => {
    utilizadoresController.alterarEstado(req, res);
});

router.get('/', verifyToken, (req, res) => {
    utilizadoresController.listarTodos(req, res);
});

module.exports = router;