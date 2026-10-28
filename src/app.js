const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'holamundo_db',
  connectTimeout: 5000
};

async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      console.log('Conectado exitosamente a MySQL.');
      return connection;
    } catch (err) {
      console.log(`Intento ${i}/${retries} fallido. Reintentando en ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return null;
}

app.get('/', async (req, res) => {
  const connection = await connectWithRetry();

  if (!connection) {
    return res.status(500).send(`
      <h1 style="color: red;">Error de conexión</h1>
      <p>No se pudo establecer conexión con MySQL tras varios intentos.</p>
    `);
  }

  try {
    const [rows] = await connection.query('SELECT VERSION() AS version, NOW() AS fecha_servidor');
    await connection.end();

    res.send(`
      <h1>¡Hola Mundo desde Express y Docker!</h1>
      <p style="color: green;"><strong>Estado:</strong> Conectado a la base de datos MySQL (${dbConfig.database}).</p>
      <ul>
        <li><strong>Versión de MySQL:</strong> ${rows[0].version}</li>
        <li><strong>Fecha de BD:</strong> ${rows[0].fecha_servidor}</li>
      </ul>
    `);
  } catch (error) {
    res.status(500).send(`<h1>Error en la consulta:</h1><pre>${error.message}</pre>`);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js corriendo en el puerto ${PORT}`);
});