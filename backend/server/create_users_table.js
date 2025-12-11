const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../restaurante.db');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('foreign_keys = ON');

const createTable = () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS Usuarios (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        `;
        db.exec(createTableQuery);
        console.log('Tabla de Usuarios creada o ya existente.');
    } catch (error) {
        console.error('Error al crear la tabla de Usuarios:', error.message);
    }
};

createTable();

db.close();
