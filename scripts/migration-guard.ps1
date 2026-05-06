param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("development", "staging", "production")]
  [string]$Environment,

  [Parameter(Mandatory = $true)]
  [string]$MigrationFile,

  [switch]$ConfirmProduction
)

if (-not (Test-Path $MigrationFile)) {
  Write-Error "Migration file not found: $MigrationFile"
  exit 1
}

if ($Environment -eq "production") {
  if (-not $ConfirmProduction) {
    Write-Error "Production migration blocked. Re-run with -ConfirmProduction after backup verification."
    exit 1
  }

  if ([string]::IsNullOrWhiteSpace($env:BACKUP_ID)) {
    Write-Error "Production migration blocked. BACKUP_ID env var is required."
    exit 1
  }
}

Write-Host "Migration guard passed for $Environment with file: $MigrationFile"
Write-Host "Next step: run this SQL in Supabase SQL Editor or your deployment pipeline."
