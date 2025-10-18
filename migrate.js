const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const migrationsDir = path.join(__dirname, 'migrations');

fs.readdir(migrationsDir, (err, files) => {
    if (err) {
        console.error('Could not list the directory.', err);
        process.exit(1);
    }

    files.sort().forEach(file => {
        if (file.endsWith('.js')) {
            const migrationPath = path.join(migrationsDir, file);
            console.log(`Running migration: ${file}`);
            const child = spawn('node', [migrationPath], { stdio: 'inherit' });

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Migration ${file} failed with code ${code}`);
                    process.exit(1);
                }
            });
        }
    });
});
