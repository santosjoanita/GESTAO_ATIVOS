const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT_APP || 3002;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar Rotas
const materiaisRouter = require('./routes/materiais');
const eventosRouter = require('./routes/eventos');
const requisicoesRouter = require('./routes/requisicoes');
const gestaoRouter = require('./routes/gestao');
const utilizadoresRouter = require('./routes/utilizadores');

// Ligar os Endpoints
app.use('/api/materiais', materiaisRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/requisicoes', requisicoesRouter);
app.use('/api/gestao', gestaoRouter);
app.use('/api/utilizadores', utilizadoresRouter);

app.get('/', (req, res) => {
    res.json({ servico: "Aplicação Principal", status: "OK" });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Backend APP na porta ${port}`);
});