const express = require('express');
const cors = require('cors');
const path = require('path');
// Procura o .env um nível acima 
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT_AUTH || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Importar Rotas
const authRoutes = require('./routes/auth');


app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({ servico: "Autenticação", status: "OK" });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🔐 Backend AUTH na porta ${port}`);
});