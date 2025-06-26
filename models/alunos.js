// models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  nome: String,
  idade: Number,
  matricula: Number
}, { collection: 'Pessoa' });;

module.exports = mongoose.model('Pessoa', ItemSchema);
