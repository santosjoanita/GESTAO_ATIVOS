const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const multer = require('multer');
const path = require('path');

const { verifyToken } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Rotas de Eventos
router.post('/', verifyToken, upload.array('anexos'), eventosController.criar);
router.get('/user/:id', verifyToken, eventosController.listarPorUser);
router.get('/todos', verifyToken, eventosController.listarTodos);
router.get('/lista-simples', verifyToken, eventosController.listarSimples);
router.get('/summary/:id', verifyToken, eventosController.obterDetalhes); 
router.get('/:id/anexos', verifyToken, eventosController.listarAnexos);

// Rota de mudança de estado
router.put('/:id/estado', verifyToken, async (req, res) => {
    const db = require('../config/db');
    const { id } = req.params;
    const { id_estado } = req.body;
    try {
        await db.execute('UPDATE Evento SET id_estado = ? WHERE id_evento = ?', [id_estado, id]);
        res.json({ msg: "Estado do evento atualizado." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;