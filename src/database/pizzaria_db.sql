-- Apagar banco se existir
DROP DATABASE IF EXISTS pizzaria_db;

-- Criar banco
CREATE DATABASE pizzaria_db;

-- Usar banco
USE pizzaria_db;

-- =========================
-- TABELA: usuarios
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(255),
    papel INT NOT NULL,  -- 0 para usuário e 1 para admin
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA: pedido
-- =========================
CREATE TABLE pedido (
  id INT AUTO_INCREMENT NOT NULL,
  usuarios_id INT NOT NULL,
  estado CHAR(1) NULL,
  PRIMARY KEY (id),
  INDEX fk_pedido_usuarios1_idx (usuarios_id ASC) VISIBLE,
  CONSTRAINT fk_pedido_usuarios1
    FOREIGN KEY (usuarios_id)
    REFERENCES usuarios (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- =========================
-- TABELA: pizzas
-- =========================
CREATE TABLE pizzas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    img VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA: pedido_pizzas
-- =========================
CREATE TABLE pedido_pizzas (
  pedido_id INT NOT NULL,
  pizzas_id INT NOT NULL,
  quantidade INT NOT NULL,
  PRIMARY KEY (pedido_id, pizzas_id),
  INDEX fk_pedido_has_pizzas_pizzas1_idx (pizzas_id ASC) VISIBLE,
  INDEX fk_pedido_has_pizzas_pedido_idx (pedido_id ASC) VISIBLE,
  CONSTRAINT fk_pedido_has_pizzas_pedido
    FOREIGN KEY (pedido_id)
    REFERENCES pedido (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_pedido_has_pizzas_pizzas1
    FOREIGN KEY (pizzas_id)
    REFERENCES pizzas (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

INSERT INTO pizzas (nome, descricao, preco, img) VALUES
('Banana com Canela', 'Molho de tomate, mussarela, banana e canela', 90.00, '/img/pizzas/bananacomcanela.jpg'),
('Frango com Catupiry', 'Molho de tomate, mussarela, frango e catupiry', 90.00, '/img/pizzas/Frangocatupiry.jpg'),
('Pizza de Calabresa', 'Molho de tomate, mussarela, calabresa e orégano', 90.00, '/img/pizzas/Pizzadecalabresa.jpg'),
('Pizza de Carne Moida', 'Molho de tomate, mussarela, carnemoida', 90.00, '/img/pizzas/Pizzadecarnemoida.jpg'),
('Pizza de Bacon', 'Molho de tomate, mussarela, bacon e orégano', 90.00, '/img/pizzas/Pizza de bacon.jpg'),
('Pizza Portuguesa', 'Molho de tomate, mussarela, presunto, ovo, cebola e orégano', 90.00, '/img/pizzas/Pizzaportuguesa.jpg'),
('Pizza de Chocolate com Morango', 'mussarela, chocolate preto e morango', 90.00, '/img/pizzas/PizzadechocolatePcommorango.jpg'),
('Pizza de Coração', 'Molho de tomate, mussarela, presunto, ovo, cebola e orégano', 90.00, '/img/pizzas/Pizzadecoração.png')