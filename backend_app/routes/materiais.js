const express = require('express');
const router = express.Router();
const materiaisController = require('../controllers/materiaisController');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para Materiais
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/', materiaisController.listarTodos);
router.get('/categorias', materiaisController.listarCategorias);
router.get('/:id', materiaisController.verDetalhe);
router.get('/:id/ocupacao', materiaisController.verOcupacaoMaterial);
router.get('/limites-evento/:id_req', materiaisController.getDatasLimiteEvento);


router.post('/', upload.single('imagem'), materiaisController.criar);


router.put('/:id', upload.single('imagem'), materiaisController.editar);
router.put('/:id/visibilidade', materiaisController.alterarVisibilidade);

module.exports = router;