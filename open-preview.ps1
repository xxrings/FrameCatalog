$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $repoRoot

Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', '"C:\Program Files\nodejs\node.exe" preview-server.js' -WorkingDirectory $repoRoot
Start-Sleep -Seconds 2
Start-Process 'http://127.0.0.1:4173'
