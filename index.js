const express = require('express')
const port = 3000
const db = require('./src/database/db');
const multer = require("multer");
const path = require("path");
const session = require('express-session');

const app = express();

// configuração de session
app.use(session({
  secret: 'seu_segredo_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true só com HTTPS
}));

function verificarLogin(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = Date.now() + ext;
    cb(null, nome);
  }
});

const upload = multer({ storage });

// configura a pasta publica
app.use(express.static('public'));

// seta o hbs
app.set('view engine', 'hbs')

// Middleware para ler dados do POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res) => {
  res.render('principal')
})

app.get('/pedido', verificarLogin, async (req, res) => {
  const pizzas = await db.query('SELECT * FROM pizzas');
  res.render('pedidos', {pizzas})
})

app.get('/item-selecionado', verificarLogin, async (req, res) => {
  res.render('item-selecionado')
})

app.get('/cadastro-pizza', verificarLogin, async (req, res) => {
  res.render('cadastroPizza');
})

app.post('/cadastro-pizza', verificarLogin, upload.single("imagem"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);
  const caminhoImagem = "/uploads/" + req.file.filename;
  if(req.body)
  {
    const pizzas = await db.query("INSERT INTO pizzas (nome, descricao, preco, img) VALUES (?, ?, ?, ?)", [req.body.nome, req.body.descricao, req.body.preco, caminhoImagem]);
    console.log(pizzas)
  }
  res.redirect("/pedido");
})

app.get('/reset-banco', async (req, res) => {
  await db.runSQLFile(); // cria o banco
  res.render('principal');
})

app.get('/login', async (req, res) => {
  res.render('loginUsuario');
})

app.get('/cadastro', async (req, res) => {
  res.render('cadastroUsuario');
})

app.post('/cadastro-usuario', async (req, res) => {
  console.log(req.body);
  if(req.body)
  {
    const user = await db.query("INSERT INTO usuarios (nome, email, senha, telefone, papel) VALUES (?, ?, ?, ?, ?)", [req.body.nome, req.body.email, req.body.senha, req.body.telefone, 0]);
    console.log(user)
  }
  res.redirect("/");
})

app.post('/login-usuario', async (req, res) => {
  if (req.body) {
    const user = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [req.body.email]
    );

    if (user[0] && user[0].senha == req.body.senha) {
      console.log("senha correta");

      // 🔑 salva na sessão
      req.session.usuario = {
        id: user[0].id,
        email: user[0].email
      };

      return res.redirect("/");
    }
  }

  res.redirect("/login");
});

app.get('/carrinho', verificarLogin, async (req, res) => {
  res.render('carrinho');
})

app.listen(port, async () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})