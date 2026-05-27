const express = require('express')
const port = 3000
const db = require('./src/database/db');
const multer = require("multer");
const path = require("path");
const session = require('express-session');
const sharp = require("sharp");

const app = express();

const hbs = require('hbs');

hbs.registerHelper('calcTotal', (preco, quantidade) => {
  return (preco * quantidade).toFixed(2);
});

hbs.registerHelper('subtotal', (pizzas) => {
  if (!pizzas || pizzas.length === 0) return "0.00";
  let total = pizzas.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  return total.toFixed(2);
});

hbs.registerHelper('total', (pizzas, entrega) => {
  if (!pizzas || pizzas.length === 0) return entrega.toFixed(2);
  let subtotal = pizzas.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  return (subtotal + entrega).toFixed(2);
});

hbs.registerHelper('calcPedidoTotal', function (itens) {
  let total = 0;
  itens.forEach(i => {
    total += i.preco * i.quantidade;
  });
  return total.toFixed(2);
});

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
  const user = req.session.usuario ? req.session.usuario : null;
  res.render('principal', { user: user })
})

app.get('/pedido', verificarLogin, async (req, res) => {
  const pizzas = await db.query('SELECT * FROM pizzas');
  res.render('pedidos', { pizzas })
})

app.get('/item-selecionado/:id', verificarLogin, async (req, res) => {
  const pizza = await db.query('SELECT * FROM pizzas where id = ?', [req.params.id]);
  res.render('item-selecionado', { pizza: pizza[0] });
})

app.get('/cadastro-pizza', verificarLogin, async (req, res) => {
  res.render('cadastroPizza');
})

app.post(
  '/cadastro-pizza',
  verificarLogin,
  upload.single("imagem"),
  async (req, res) => {

    try {

      // nome da imagem final
      const nomeImagem = Date.now() + ".jpg";

      // caminho final
      const caminhoFinal = path.join(
        __dirname,
        "public/uploads/",
        nomeImagem
      );

      // resize da imagem
      await sharp(req.file.path)
        .resize(650, 432, {
          fit: "cover"
        })
        .jpeg({ quality: 80 })
        .toFile(caminhoFinal);

      // caminho salvo no banco
      const caminhoImagem = "/uploads/" + nomeImagem;

      // salva no banco
      await db.query(
        "INSERT INTO pizzas (nome, descricao, preco, img) VALUES (?, ?, ?, ?)",
        [
          req.body.nome,
          req.body.descricao,
          req.body.preco,
          caminhoImagem
        ]
      );

      res.redirect("/pedido");

    } catch (err) {
      console.log(err);
      res.status(500).send("Erro ao cadastrar pizza");
    }
  });

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
  if (req.body) {
    try {
      const user = await db.query("INSERT INTO usuarios (nome, email, senha, telefone, papel) VALUES (?, ?, ?, ?, ?)", [req.body.nome, req.body.email, req.body.senha, req.body.telefone, 0]);
    } catch (error) {
      res.redirect("/");
    }
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
  try {
    let pedido = await db.query(
      "SELECT * FROM pedido WHERE usuarios_id = ? AND estado = ?",
      [req.session.usuario.id, "c"]
    );

    if (!pedido[0]) return res.render('carrinho', { pizzasJSON: "[]", pedidoId: null });

    const pizzas = await db.query(
      `SELECT pp.quantidade, p.nome, p.preco, p.img, p.id as pizza_id
       FROM pedido_pizzas pp
       JOIN pizzas p ON pp.pizzas_id = p.id
       WHERE pp.pedido_id = ?`,
      [pedido[0].id]
    );

    console.log(pizzas)

    res.render('carrinho', {
      pizzas: pizzas,
      pedidoId: pedido[0].id
    });

  } catch (err) {
    console.error("Erro ao carregar carrinho:", err);
    res.status(500).send("Erro ao carregar carrinho");
  }
});

app.get('/logout', verificarLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect('/');
    }

    res.clearCookie('connect.sid'); // limpa o cookie da sessão
    res.redirect('/');
  });
});

app.post('/adicionar-item', verificarLogin, async (req, res) => {
  try {
    // Verifica se o corpo da requisição tem o ID da pizza
    if (req.body && req.body.id) {

      // Verificar se existe um carrinho aberto desse usuário
      let pedido = await db.query(
        "SELECT * FROM pedido WHERE usuarios_id = ? AND estado = ?",
        [req.session.usuario.id, "c"]
      );

      // Se não encontrou, criar um pedido no estado "carrinho"
      if (!pedido[0]) {
        await db.query(
          "INSERT INTO pedido (usuarios_id, estado) VALUES (?, ?)",
          [req.session.usuario.id, "c"]
        );

        pedido = await db.query(
          "SELECT * FROM pedido WHERE usuarios_id = ? AND estado = ?",
          [req.session.usuario.id, "c"]
        );
      }

      // Verificar se a pizza já existe dentro do pedido
      let pizza = await db.query(
        "SELECT * FROM pedido_pizzas WHERE pedido_id = ? AND pizzas_id = ?",
        [pedido[0].id, req.body.id]
      );

      if (!pizza[0]) {
        // Inserir nova pizza no pedido
        await db.query(
          "INSERT INTO pedido_pizzas (pedido_id, pizzas_id, quantidade) VALUES (?, ?, ?)",
          [pedido[0].id, req.body.id, 1]
        );
      } else {
        // Incrementar quantidade da pizza existente
        await db.query(
          "UPDATE pedido_pizzas SET quantidade = ? WHERE pedido_id = ? AND pizzas_id = ?",
          [pizza[0].quantidade + 1, pedido[0].id, req.body.id]
        );
      }
    }

    // Redireciona para a página do carrinho
    res.redirect("/carrinho");

  } catch (err) {
    console.error("Erro ao adicionar item:", err);
    res.status(500).send("Erro ao adicionar item ao carrinho.");
  }
});

// Rota para finalizar o pedido
app.post('/finalizar-pedido', verificarLogin, async (req, res) => {
  try {
    // Busca o carrinho atual do usuário
    const pedido = await db.query(
      "SELECT * FROM pedido WHERE usuarios_id = ? AND estado = ?",
      [req.session.usuario.id, "c"]
    );

    if (!pedido[0]) {
      return res.status(400).send("Nenhum carrinho encontrado para finalizar.");
    }

    // Atualiza o estado para 'e' (enviado/finalizado)
    await db.query(
      "UPDATE pedido SET estado = ? WHERE id = ?",
      ["e", pedido[0].id]
    );

    // Redireciona para a página principal ou de confirmação
    res.redirect('/pedido-finalizado'); // você pode criar uma view de confirmação
  } catch (err) {
    console.error("Erro ao finalizar pedido:", err);
    res.status(500).send("Erro ao finalizar pedido.");
  }
});

// Rota para página de pedido finalizado
app.get('/pedido-finalizado', verificarLogin, (req, res) => {
  res.render('pedido-finalizado', {
    usuario: req.session.usuario,
    mensagem: "Pedido finalizado com sucesso! 🍕"
  });
});

// Rota para mostrar pedidos encaminhados
app.get('/pedidos-encaminhados', verificarLogin, async (req, res) => {
  try {
    // Busca todos os pedidos do usuário com estado 'e' (encaminhado)
    const pedidosRaw = await db.query(
      `SELECT p.id as pedido_id, p.estado,
              pp.quantidade, piz.nome, piz.preco, piz.img
       FROM pedido p
       JOIN pedido_pizzas pp ON pp.pedido_id = p.id
       JOIN pizzas piz ON piz.id = pp.pizzas_id
       WHERE p.usuarios_id = ? AND p.estado = 'e'
       ORDER BY p.id DESC`,
      [req.session.usuario.id]
    );

    // Agrupa pizzas pelo pedido
    const pedidosAgrupados = [];

    pedidosRaw.forEach(item => {
      let pedido = pedidosAgrupados.find(p => p.pedido_id === item.pedido_id);
      if (!pedido) {
        pedido = {
          pedido_id: item.pedido_id,
          estado: item.estado,
          pizzas: []
        };
        pedidosAgrupados.push(pedido);
      }
      pedido.pizzas.push({
        nome: item.nome,
        preco: item.preco,
        img: item.img,
        quantidade: item.quantidade
      });
    });

    res.render('pedidos-encaminhados', { pedidos: pedidosAgrupados });

  } catch (err) {
    console.error("Erro ao carregar pedidos encaminhados:", err);
    res.status(500).send("Erro ao carregar pedidos encaminhados");
  }
});

app.listen(port, async () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})