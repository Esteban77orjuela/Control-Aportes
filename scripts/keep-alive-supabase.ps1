param(
  [string]$EnvFile = ""
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $EnvFile) { $EnvFile = Join-Path (Split-Path -Parent $scriptRoot) '.env' }

$logDir = Join-Path $scriptRoot 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir 'keep-alive.log'

function Write-Log {
  param([string]$Message)
  $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
}

function Read-EnvValue {
  param([string]$FilePath, [string]$Key)
  if (-not (Test-Path $FilePath)) { return $null }
  $match = Select-String -LiteralPath $FilePath -Pattern ('^{0}\s*=\s*(.*)$' -f [regex]::Escape($Key))
  if ($match) { return $match.Matches[0].Groups[1].Value.Trim() }
  return $null
}

$supabaseUrl = $env:EXPO_PUBLIC_SUPABASE_URL
$supabaseAnonKey = $env:EXPO_PUBLIC_SUPABASE_ANON_KEY
if (-not $supabaseUrl) { $supabaseUrl = Read-EnvValue -FilePath $EnvFile -Key 'EXPO_PUBLIC_SUPABASE_URL' }
if (-not $supabaseAnonKey) { $supabaseAnonKey = Read-EnvValue -FilePath $EnvFile -Key 'EXPO_PUBLIC_SUPABASE_ANON_KEY' }

if (-not $supabaseUrl -or -not $supabaseAnonKey) {
  Write-Log 'FAIL: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  exit 1
}

$uri = "$($supabaseUrl.TrimEnd('/'))/rest/v1/rpc/keep_alive"
$headers = @{
  'apikey'        = $supabaseAnonKey
  'Authorization' = "Bearer $supabaseAnonKey"
  'Content-Type'  = 'application/json'
}

function Invoke-KeepAlive {
  $attempt = 0
  while ($attempt -lt 3) {
    try {
      $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{}' -TimeoutSec 30
      if ($response.ok) {
        Write-Log "OK: keep_alive() -> { ok: true, timestamp: $($response.timestamp) }"
        return $true
      }
      Write-Log "WARN: keep_alive() responded without ok=true (response: $(($response | ConvertTo-Json -Compress)))"
      return $true
    } catch {
      $attempt++
      if ($attempt -ge 3) {
        $detail = $_.Exception.Message
        if ($_.ErrorDetails.Message) { $detail = $_.ErrorDetails.Message }
        Write-Log "FAIL: keep_alive() attempt $attempt/3 -> $detail"
        return $false
      }
      Start-Sleep -Seconds (5 * $attempt)
    }
  }
  return $false
}

$success = Invoke-KeepAlive
if ($success) { exit 0 }
exit 1