const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                whatsapp TEXT,
                address TEXT,
                tags TEXT
            )
        `);
        console.log('Table "contacts" created successfully.');
    } catch (error) {
        console.error('Error creating table "contacts":', error);
    }

    await db.close();
}

migrate();
