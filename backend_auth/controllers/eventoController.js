const db = require('../db'); 
// id_estado para 'PENDENTE'
const ESTADO_PENDENTE_ID = 1; 

/**
  @param {object} req 
  @param {object} res 
 */
const createEvent = async (req, res) => {
    // Nota: O id_user deve vir do token de sessão após a autenticação.
    // id para testar 
    const id_user = 1; 
    const { 
        nome, 
        descricao, 
        localizacao, 
        data_inicio, 
        hora_inicio, 
        data_fim, 
        hora_fim 
        // tratar dos anexos separadamente
    } = req.body;

    if (!nome || !descricao || !localizacao || !data_inicio) {
        return res.status(400).json({ 
            message: 'Erro: Campos obrigatórios (nome, descricao, localizacao, data_inicio) em falta.' 
        });
    }

    const query = `
        INSERT INTO Evento (
            id_user, 
            id_estado, 
            nome_evento, 
            descricao, 
            localizacao, 
            data_inicio, 
            hora_inicio, 
            data_fim, 
            hora_fim
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        id_user,
        ESTADO_PENDENTE_ID,
        nome,
        descricao,
        localizacao,
        data_inicio,
        hora_inicio || null,
        data_fim || null,
        hora_fim || null,
    ];

    try {
        const [result] = await db.execute(query, values);
        
        // Devolve o ID do novo evento
        res.status(201).json({ 
            message: 'Evento criado com sucesso e enviado para aprovação.', 
            eventId: result.insertId 
        });

    } catch (error) {
        console.error('Erro ao criar evento:', error);
        res.status(500).json({ 
            message: 'Erro interno ao submeter o evento.', 
            error: error.message 
        });
    }
};

module.exports = {
    createEvent
};