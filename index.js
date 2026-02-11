const express = require('express')
const app = express()
const port = 3000

app.set('view engine', 'hbs')

app.get('/', (req, res) => {
  res.render('principal')
})

app.get('/pedido', (req, res) => {
  res.render('pedidos')
})

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})