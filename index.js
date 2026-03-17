const express = require('express')
const app = express()
const port = 3000
const db = require('./src/database/db');

// configura a pasta publica
app.use(express.static('public'));
// seta o hbs
app.set('view engine', 'hbs')

app.get('/', async (req, res) => {
  res.render('principal')
})

app.get('/pedido', async (req, res) => {
  res.render('pedidos')
})

app.get('/item-selecionado', async (req, res) => {
  res.render('item-selecionado')
})

app.get('/db', async (req, res) => {
  await db.runSQLFile();     // cria o banco
  const pizzas = await db.query('SELECT * FROM pizzas');
  res.send(pizzas);
})

app.listen(port, async () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})