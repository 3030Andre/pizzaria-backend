const express = require('express')
const app = express()
const port = 3000
const db = require('./src/database/db');

// configura a pasta publica
app.use(express.static('public'));

// seta o hbs
app.set('view engine', 'hbs')

// Middleware para ler dados do POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res) => {
  await db.runSQLFile(); // cria o banco
  res.render('principal')
})

app.get('/pedido', async (req, res) => {
  const pizzas = await db.query('SELECT * FROM pizzas');
  res.render('pedidos', {pizzas})
})

app.get('/item-selecionado', async (req, res) => {
  res.render('item-selecionado')
})

app.get('/cadastro-pizza', async (req, res) => {
  res.render('cadastroPizza');
})

app.post('/cadastro-pizza', async (req, res) => {
  console.log(req.body);
  if(req.body)
  {
    const pizzas = await db.query("INSERT INTO pizzas (nome, descricao, preco, img) VALUES (?, ?, ?, ?)", [req.body.nome, req.body.descricao, req.body.preco, req.body.imagem]);
    console.log(pizzas)
  }
  res.redirect("/pedido");
})

app.listen(port, async () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})