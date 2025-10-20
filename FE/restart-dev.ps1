# Stop any existing Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Change to project directory
Set-Location "c:\Users\ASUS\Desktop\jadwalim"

# Remove .next directory to clear build cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Cleared .next cache directory"
}

# Start development server
Write-Host "Starting development server..."
npm run dev
