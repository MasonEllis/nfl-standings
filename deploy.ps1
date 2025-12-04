# Define variables
$USER = "mason"
$HOST_IP = "mellis.io"
$REMOTE_PATH = "/usr/local/src/nfl-standings"

# Note: Standard SSH does not accept a password variable for security. 
# To avoid entering your password entirely, we recommend setting up SSH keys.
# This script uses a single connection to minimize prompts to just ONE time.

Write-Host "Starting deployment to $HOST_IP..."

# Create remote directory (if needed) and extract files in ONE connection
# We assume the directory is writable by the user (from previous runs)
# If it's not, run: ssh -t $USER@$HOST_IP "sudo chown -R $USER:$USER $REMOTE_PATH" once manually.

Write-Host "Uploading and extracting files..."

# Use tar to stream all files over a single SSH connection
# Excludes node_modules, .git, dist, and other non-source files
tar --exclude "node_modules" --exclude ".git" --exclude "dist" --exclude ".idea" --exclude ".vscode" -czf - . | ssh $USER@$HOST_IP "mkdir -p $REMOTE_PATH && tar -xzf - -C $REMOTE_PATH"

Write-Host "Files uploaded to $REMOTE_PATH"
Write-Host "Deployment complete."
