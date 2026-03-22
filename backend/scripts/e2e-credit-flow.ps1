$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE } else { 'http://localhost:8080' }
$stamp = [int][double]::Parse((Get-Date -UFormat %s))

Write-Host '=== 1. Employee login ===' 
$emp = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' `
    -Body '{"email":"admin@bank.local","password":"admin","role":"employee"}'
$hEmp = @{ Authorization = "Bearer $($emp.token)" }

Write-Host '=== 2. Create tariff ===' 
$tariff = Invoke-RestMethod -Method Post -Uri "$base/tariffs" -Headers $hEmp -ContentType 'application/json' `
    -Body (@{ name = "E2E$stamp"; rate = 0.12; min_amount = 50; max_amount = 100000 } | ConvertTo-Json)
Write-Host "tariff id=$($tariff.id)"

Write-Host '=== 3. Create client user ===' 
$user = Invoke-RestMethod -Method Post -Uri "$base/users" -Headers $hEmp -ContentType 'application/json' `
    -Body (@{ type = 'client'; email = "e2e$stamp@test.local"; full_name = 'E2E Client'; password = '123' } | ConvertTo-Json)
Write-Host "user id=$($user.id)"

Write-Host '=== 4. Client login ===' 
$cli = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' `
    -Body (@{ email = "e2e$stamp@test.local"; password = '123'; role = 'client' } | ConvertTo-Json)
$hCli = @{ Authorization = "Bearer $($cli.token)" }

Write-Host '=== 5. Open account ===' 
$acc = Invoke-RestMethod -Method Post -Uri "$base/accounts" -Headers $hCli -ContentType 'application/json' `
    -Body (@{ client_id = $user.id; currency = 'RUB' } | ConvertTo-Json)
Write-Host "account id=$($acc.id) balance=$($acc.balance) (expect 0)"

$creditAmount = 1000
Write-Host '=== 6. Issue credit ===' 
$cr = Invoke-RestMethod -Method Post -Uri "$base/credits" -Headers $hCli -ContentType 'application/json' `
    -Body (@{ client_id = $user.id; account_id = $acc.id; tariff_id = $tariff.id; amount = $creditAmount; term_days = 30 } | ConvertTo-Json)
Write-Host "credit id=$($cr.id) remaining=$($cr.remaining) total_due=$($cr.total_due) (principal on account=$creditAmount)"

$acc2 = Invoke-RestMethod -Method Get -Uri "$base/accounts/$($acc.id)" -Headers $hCli
Write-Host "account balance after credit: $($acc2.balance) (expect $creditAmount)"

Write-Host '=== 7. Repay credit (full) ===' 
$rep = Invoke-RestMethod -Method Post -Uri "$base/credits/$($cr.id)/repay" -Headers $hCli -ContentType 'application/json' `
    -Body (@{ amount = $cr.remaining; account_id = $acc.id } | ConvertTo-Json)
Write-Host "repay remaining=$($rep.remaining) status=$($rep.status) (expect 0, paid)"

$acc3 = Invoke-RestMethod -Method Get -Uri "$base/accounts/$($acc.id)" -Headers $hCli
Write-Host "account balance after repay: $($acc3.balance) (expect 0)"

Write-Host '=== OK ===' 
