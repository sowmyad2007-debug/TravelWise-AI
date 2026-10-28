Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  Starting TravelWise AI+ — Adaptive AI Travel Planner & Budget Guardian" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "backend"
py run_app.py
