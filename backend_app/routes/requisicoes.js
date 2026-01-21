const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.post('/', verifyToken, upload.array('anexos'), eventosController.criar);
router.get('/user/:id', verifyToken, eventosController.listarPorUser);
router.get('/todos', verifyToken, eventosController.listarTodos);
router.get('/lista-simples', verifyToken, eventosController.listarSimples);
router.get('/summary/:id', verifyToken, eventosController.obterDetalhes); 
router.get('/:id/anexos', verifyToken, eventosController.listarAnexos);

module.exports = router;