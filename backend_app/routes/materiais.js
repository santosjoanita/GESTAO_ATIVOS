const express = require('express');
const router = express.Router();
const materiaisController = require('../controllers/materiaisController');

// --- CORREÇÃO AQUI ---
const { verifyToken } = require('../middleware/authMiddleware'); 

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- ROTAS ---

// Listagens (Públicas ou não, conforme a tua lógica)
router.get('/', materiaisController.listarTodos);
router.get('/categorias', materiaisController.listarCategorias);

// Detalhes
router.get('/:id', materiaisController.getById);

// Ocupação (Protegida com verifyToken)
router.get('/:id/ocupacao', verifyToken, materiaisController.getOcupacao);

// Gestão (Protegidas com verifyToken + Upload)
router.post('/', verifyToken, upload.single('imagem'), materiaisController.criar);
router.put('/:id', verifyToken, upload.single('imagem'), materiaisController.editar);
router.put('/:id/visibilidade', verifyToken, materiaisController.alterarVisibilidade);
router.delete('/:id', verifyToken, materiaisController.eliminar);

module.exports = router;