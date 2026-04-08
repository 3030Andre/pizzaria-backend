const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'pizzaria_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool de conexões
const pool = mysql.createPool(dbConfig);

// =========================
// TESTAR CONEXÃO
// =========================
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao MySQL');
    connection.release();
  } catch (err) {
    console.error('❌ Erro ao conectar no MySQL:', err);
  }
}

// =========================
// RODAR ARQUIVO SQL
// =========================
async function runSQLFile() {
  try {
    const filePath = path.join(__dirname, 'pizzaria_db.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true, // IMPORTANTE
    });

    await connection.query(sql);
    await connection.end();

    console.log('🚀 Banco criado/atualizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao rodar SQL:', err);
  }
}

// =========================
// QUERY (SELECT)
// =========================
async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('❌ Erro na query:', err);
    throw err;
  }
}

// =========================
// EXECUTE (INSERT/UPDATE/DELETE)
// =========================
async function execute(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (err) {
    console.error('❌ Erro no execute:', err);
    throw err;
  }
}

// =========================
// EXPORTS
// =========================
module.exports = {
  query,
  execute,
  pool,
  testConnection,
  runSQLFile,
};