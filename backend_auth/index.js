const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT_AUTH || 3001;

app.use(cors());
app.use(express.json());


const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

app.listen(port, '0.0.0.0', () => {
    console.log(`🔐 Servidor de Autenticação na porta ${port}`);
});