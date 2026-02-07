@echo off
title NexShop - Full Setup
color 0A
echo.
echo  ========================================
echo   NexShop - Full Project Setup
echo  ========================================
echo.

:: -------------------------------------------
:: 1. Check Prerequisites
:: -------------------------------------------
echo [1/6] Checking prerequisites...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node -v') do echo  Node.js: %%v

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm is not found.
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('npm -v') do echo  npm:     v%%v

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Docker is not installed.
    echo  Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
for /f "tokens=3" %%v in ('docker --version') do echo  Docker:  %%v

echo.
echo  All prerequisites found.
echo.

:: -------------------------------------------
:: 2. Install npm dependencies
:: -------------------------------------------
echo [2/6] Installing npm dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.
echo  Dependencies installed successfully.
echo.

:: -------------------------------------------
:: 3. Start Docker Desktop (if not running)
:: -------------------------------------------
echo [3/6] Checking Docker daemon...
echo.
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Waiting for Docker to start...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
)
echo  Docker is running.
echo.

:: -------------------------------------------
:: 4. Initialize Supabase (if needed)
:: -------------------------------------------
echo [4/6] Initializing Supabase...
echo.
if not exist "supabase\config.toml" (
    call npx supabase init
    echo  Supabase initialized.
) else (
    echo  Supabase already initialized, skipping.
)
echo.

:: -------------------------------------------
:: 5. Start local Supabase
:: -------------------------------------------
echo [5/6] Starting local Supabase (this may take a few minutes on first run)...
echo.
call npx supabase start
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to start Supabase.
    echo  Make sure Docker Desktop is running and try again.
    pause
    exit /b 1
)

:: Get Supabase credentials
echo.
echo  Fetching local Supabase credentials...
for /f "tokens=2 delims==" %%a in ('npx supabase status -o env 2^>nul ^| findstr "API_URL"') do set "API_URL=%%~a"
for /f "tokens=2 delims==" %%a in ('npx supabase status -o env 2^>nul ^| findstr "ANON_KEY"') do set "ANON_KEY=%%~a"

:: Remove surrounding quotes if present
set "API_URL=%API_URL:"=%"
set "ANON_KEY=%ANON_KEY:"=%"

echo.

:: -------------------------------------------
:: 6. Create .env file
:: -------------------------------------------
echo [6/6] Creating .env file...
echo.
if exist ".env" (
    echo  .env file already exists. Backing up to .env.backup
    copy /y ".env" ".env.backup" >nul
)

(
echo VITE_SUPABASE_URL=%API_URL%
echo VITE_SUPABASE_ANON_KEY=%ANON_KEY%
) > .env

echo  .env file created with local Supabase credentials.
echo.

:: -------------------------------------------
:: Done
:: -------------------------------------------
echo  ========================================
echo   Setup Complete!
echo  ========================================
echo.
echo  Local services:
echo    App (after run.bat):  http://localhost:5173
echo    Supabase Studio:      http://127.0.0.1:54323
echo    Supabase API:         http://127.0.0.1:54321
echo    Mailpit (emails):     http://127.0.0.1:54324
echo.
echo  Next step: run "run.bat" to start the app.
echo.
pause
