param(
    [Parameter(Mandatory=$true)][string]$CertificateThumbprint,
    [Parameter(Mandatory=$true)][string]$PublisherSha256,
    [Parameter(Mandatory=$true)][string]$TimestampServer,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Desktop packaging requires Windows' }
$desktopRoot = Split-Path $PSScriptRoot -Parent
$coreRoot = Join-Path (Split-Path $desktopRoot -Parent) 'fatrocu-cli'
$serverRoot = Join-Path (Split-Path $desktopRoot -Parent) 'fatrocu-server'
if ((git -C $coreRoot rev-parse HEAD) -ne (Get-Content (Join-Path $desktopRoot 'core-revision.txt'))) { throw 'Core checkout does not match the pinned revision' }
if ((git -C $serverRoot rev-parse HEAD) -ne (Get-Content (Join-Path $desktopRoot 'server-revision.txt'))) { throw 'Server checkout does not match the pinned revision' }
foreach ($repository in @($coreRoot,$serverRoot,$desktopRoot)) {
    cargo build --locked --release --manifest-path (Join-Path $repository 'Cargo.toml')
    if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
}
$certificate = Get-Item -LiteralPath "Cert:\CurrentUser\My\$CertificateThumbprint"
$hasher = [System.Security.Cryptography.SHA256]::Create()
$fingerprint = [System.BitConverter]::ToString($hasher.ComputeHash($certificate.RawData)).Replace('-', '')
if ($fingerprint -ne $PublisherSha256) { throw 'The certificate does not match the confirmed publisher identity' }
$files = @((Join-Path $desktopRoot 'target\release\fatrocu.exe'),(Join-Path $coreRoot 'target\release\fatrocu-updater.exe'),(Join-Path $serverRoot 'target\release\fatrocu-server.exe'))
foreach ($file in $files) {
    $signature = Set-AuthenticodeSignature -LiteralPath $file -Certificate $certificate -HashAlgorithm SHA256 -TimestampServer $TimestampServer
    if ($signature.Status -ne 'Valid') { throw "Signature verification failed: $file" }
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant().Replace('x64','x86_64').Replace('arm64','aarch64')
$archive = Join-Path $OutputDirectory "fatrocu-desktop-windows-$architecture.zip"
if (Test-Path -LiteralPath $archive) { throw 'Candidate archive already exists' }
Compress-Archive -LiteralPath $files -DestinationPath $archive
Get-FileHash -LiteralPath $archive -Algorithm SHA256
