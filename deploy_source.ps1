
Write-Host "1. Setting permissions on remote directory..."
ssh -t mason@mellis.io "sudo chown -R mason:mason /usr/local/src/nfl-standings"

Write-Host "2. Uploading source code..."
scp -r src public scripts package.json package-lock.json tsconfig.json vite.config.ts tailwind.config.js index.html postcss.config.js mason@mellis.io:/usr/local/src/nfl-standings/

Write-Host "3. Building and running on server..."
ssh -t mason@mellis.io "cd /usr/local/src/nfl-standings && npm install && npm run build"
