const express = require('express');
const router = express.Router();
const utilizadoresController = require('../controllers/utilizadoresController');

router.get('/', utilizadoresController.listarTodos);
router.get('/perfis', utilizadoresController.obterPerfil);

module.exports = router;