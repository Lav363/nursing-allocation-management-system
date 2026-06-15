# start-db.ps1
# PowerShell script to initialize and run local MySQL server in user space

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
$mysqlCli = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
$projectDir = "C:\Users\lavan\.gemini\antigravity\scratch\nursing-allocation-system"
$dataDir = "$projectDir\mysql-data"

# 1. Initialize data directory if not present
if (!(Test-Path $dataDir)) {
    Write-Host "Initializing MySQL data directory (insecure, no password)..."
    & $mysqlPath --initialize-insecure --datadir=$dataDir
    Write-Host "MySQL data directory initialized."
}

# 2. Check if mysql daemon is already running
$running = Get-Process -Name mysqld -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "MySQL server is already running."
} else {
    Write-Host "Starting MySQL server process on port 3306..."
    Start-Process -FilePath $mysqlPath -ArgumentList "--datadir=`"$dataDir`" --port=3306 --console" -NoNewWindow
    Write-Host "Waiting for database to start..."
    Start-Sleep -Seconds 5
}

# 3. Create database and load schema
Write-Host "Applying schema and seed data..."
& $mysqlCli -h 127.0.0.1 -u root --port=3306 -e "source $projectDir\database\schema.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialization completed successfully!"
} else {
    Write-Error "Failed to initialize database schema. Ensure mysql-data is running and port 3306 is free."
}
