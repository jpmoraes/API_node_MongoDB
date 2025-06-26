// routes/itens.js
const express = require('express');
const router = express.Router();
const Item = require('../models/alunos');
const path = require('path'); 

// GET /api/itens - Lista todos os itens
router.get('/alldata', async (req, res) => {
  try {
    const itens = await Item.find();
    res.json(itens);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar itens' });
  }
});

// GET /api/itens/nome/:nome - Busca por nome
router.get('/matricula/:matricula', async (req, res) => {
  try {
    const item = await Item.findOne({ matricula: req.params.matricula });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar item por nome' });
  }
});

router.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = router;
