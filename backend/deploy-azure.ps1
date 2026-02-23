#!/usr/bin/env pwsh
# ============================================================
# Azure App Service Deploy Script
# Forex Signal Backend - One-time setup
# ============================================================
# Ажиллуулах: cd backend && pwsh deploy-azure.ps1

# ---- ТОХИРГОО (өөрчлөх хэрэгтэй) ----
$RESOURCE_GROUP = "forex-signal-rg"
$LOCATION       = "eastasia"          # Ойрын region (Japan East ч болно)
$APP_NAME       = "predictrix-forex-api"  # ДЭЛХИЙД ДАВТАГДАШГҮЙ нэр
$APP_PLAN       = "forex-signal-plan"
$PYTHON_VERSION = "3.11"
# ----------------------------------------

Write-Host "=== Azure Forex Signal Backend Deploy ===" -ForegroundColor Cyan

# 1. Azure-д нэвтрэх
Write-Host "`n[1/6] Azure-д нэвтэрч байна..." -ForegroundColor Yellow
az login

# 2. Resource Group үүсгэх
Write-Host "`n[2/6] Resource Group үүсгэж байна: $RESOURCE_GROUP" -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. App Service Plan үүсгэх (B1 = ~$13/сар, 24/7)
Write-Host "`n[3/6] App Service Plan үүсгэж байна (B1 Linux)..." -ForegroundColor Yellow
az appservice plan create `
    --name $APP_PLAN `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --sku B1 `
    --is-linux

# 4. Web App үүсгэх
Write-Host "`n[4/6] Web App үүсгэж байна: $APP_NAME" -ForegroundColor Yellow
az webapp create `
    --name $APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --plan $APP_PLAN `
    --runtime "PYTHON:$PYTHON_VERSION"

# 5. Startup command тохируулах
Write-Host "`n[5/6] Startup command тохируулж байна..." -ForegroundColor Yellow
az webapp config set `
    --name $APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --startup-file "gunicorn app:app --bind 0.0.0.0:8000 --workers 1 --timeout 120"

# 6. Code deploy хийх (current folder = backend/)
Write-Host "`n[6/6] Code deploy хийж байна..." -ForegroundColor Yellow
az webapp up `
    --name $APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --runtime "PYTHON:$PYTHON_VERSION" `
    --sku B1

Write-Host "`n✅ Deploy амжилттай!" -ForegroundColor Green
Write-Host "URL: https://$APP_NAME.azurewebsites.net" -ForegroundColor Cyan
Write-Host "`n⚠️  ДАРААГИЙН АЛХАМ: Environment Variables тохируулах" -ForegroundColor Red
Write-Host "   Az Portal → App Service → Configuration → Application settings" -ForegroundColor White
