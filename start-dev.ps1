# PowerShell script to start the development servers
Write-Host "Starting MazadClick Development Servers..." -ForegroundColor Green

# Function to start server in new window
function Start-ServerInNewWindow {
    param($Directory, $Command, $Title)
    
    Write-Host "Starting $Title..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$Directory'; $Command; Write-Host '$Title is running...' -ForegroundColor Green"
}

# Get the parent directory (project root)
$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Start Backend Server
Start-ServerInNewWindow -Directory "$ProjectRoot\server" -Command "npm run start:dev" -Title "Backend Server (Port 3000)"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend (Buyer)
Start-ServerInNewWindow -Directory "$ProjectRoot\buyer" -Command "npm run dev" -Title "Buyer Frontend (Port 3001)"

Write-Host "`nBoth servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: https://buyer-mazad.vercel.app" -ForegroundColor Cyan
Write-Host "`nPress any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
