const express = require('express');
const router = express.Router();
const materiaisController = require('../controllers/materiaisController');

const { verifyToken } = require('../middleware/authMiddleware'); 

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- ROTAS ---

// Listagens 
router.get('/', materiaisController.listarTodos);
router.get('/categorias', materiaisController.listarCategorias);

// Detalhes
router.get('/:id', materiaisController.getById);

// Ocupação 
router.get('/:id/ocupacao', verifyToken, materiaisController.getOcupacao);
router.get('/limites-evento/:idReq', verifyToken, materiaisController.getLimitesEvento);
router.get('/quantidadeReal/:id/:data_ini/:data_fim', materiaisController.quantidade_disp);

// Gestão 
router.post('/', verifyToken, upload.single('imagem'), materiaisController.criar);
router.put('/:id', verifyToken, upload.single('imagem'), materiaisController.editar);
router.put('/:id/visibilidade', verifyToken, materiaisController.alterarVisibilidade);
router.delete('/:id', verifyToken, materiaisController.eliminar);

module.exports = router;