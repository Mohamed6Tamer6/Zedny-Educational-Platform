$ErrorActionPreference = "Stop"

Write-Host "Checking for processes on port 8000..."
$connections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        $pid_to_kill = $conn.OwningProcess
        if ($pid_to_kill -ne 0 -and $pid_to_kill -ne $PID) {
            Write-Host "Killing process ID: $pid_to_kill"
            try {
                Stop-Process -Id $pid_to_kill -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "Could not kill process $pid_to_kill. It may strictly be terminated."
            }
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "Starting Server..."
& ".\venv\Scripts\python.exe" run.py
