#!/bin/bash

# Images Shuffler Server Startup Script
echo "🎨 Starting Images Shuffler Server..."

# Kill any existing server processes
pkill -f "node server.js" 2>/dev/null

# Wait a moment for cleanup
sleep 1

# Start the server
node server.js