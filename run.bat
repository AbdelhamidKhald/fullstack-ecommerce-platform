@echo off
title NexShop - Development Server
color 0A
echo.
echo  ========================================
echo   NexShop - Starting Development Server
echo  ========================================
echo.

:: -------------------------------------------
:: 1. Verify .env exists
:: -------------------------------------------
if not exist ".env" (
    echo  [ERROR] .env file not found.
    echo  Please run setup.bat first.
    echo.
    pause
    exit /b 1
)
echo  [OK] .env file found.

:: -------------------------------------------
:: 2. Verify node_modules
:: -------------------------------------------
if not exist "node_modules" (
    echo  [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
)
echo  [OK] Dependencies installed.

:: -------------------------------------------
:: 3. Check Docker is running
:: -------------------------------------------
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  Waiting for Docker to start...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
)
echo  [OK] Docker is running.

:: -------------------------------------------
:: 4. Start Supabase (if not already running)
:: -------------------------------------------
docker ps --filter "name=supabase_db" --format "{{.Names}}" 2>nul | findstr "supabase" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Starting local Supabase...
    call npx supabase start
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to start Supabase. Run setup.bat first.
        pause
        exit /b 1
    )
)
echo  [OK] Supabase is running.

:: -------------------------------------------
:: 5. Start Vite dev server
:: -------------------------------------------
echo.
echo  ========================================
echo   All services ready! Starting app...
echo  ========================================
echo.
echo  App:              http://localhost:5173
echo  Supabase Studio:  http://127.0.0.1:54323
echo  Mailpit (emails): http://127.0.0.1:54324
echo.
echo  Press Ctrl+C to stop the dev server.
echo  ----------------------------------------
echo.

call npm run dev
