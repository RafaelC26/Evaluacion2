const mongoose = require('mongoose');

// Conexión cacheada: en Vercel (serverless) se reutiliza entre invocaciones.
let cached = global.__mongoose || (global.__mongoose = { conn: null, promise: null });

async function conectarDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta la variable de entorno MONGODB_URI');
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || 'arbol_genealogico',
      serverSelectionTimeoutMS: 10000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

module.exports = { conectarDB };
