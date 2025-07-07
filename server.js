// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const itensRouter = require('./routes/itens');
const path = require('path');

// Servir arquivos estáticos da pasta "public"
const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado!'))
  .catch(err => console.error('Erro ao conectar:', err));

// Usar o router para as rotas de /
app.use('/', itensRouter);

// Rodar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
