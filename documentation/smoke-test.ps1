<#
  Smoke test for the Gym Management API.
  Run with the backend server running, from the project root:
      .\documentation\smoke-test.ps1
  It creates ONE throw-away member (smoke.xxxx@smoke.gym.local), tests the main flows,
  then cancels and deletes that member. If the script stops half-way, delete that member
  from the admin panel.
#>
param(
  [Parameter(Mandatory = $true)][string]$AdminPassword,
  [string]$SamplePassword = '',            # password printed by "npm run seed:sample" (optional)
  [string]$AdminEmail = 'admin@gym.local',
  [string]$Base = 'http://localhost:5000/api/v1'
)

$ErrorActionPreference = 'Stop'
$script:pass = 0
$script:fail = 0
$xhr = @{ 'X-Requested-With' = 'XMLHttpRequest' }

function Call {
  param([string]$Method, [string]$Path, $Body = $null, [string]$Token = '', [hashtable]$Extra = @{})
  $h = @{}
  foreach ($k in $Extra.Keys) { $h[$k] = $Extra[$k] }
  if ($Token) { $h['Authorization'] = "Bearer $Token" }
  $p = @{ Method = $Method; Uri = "$Base$Path"; UseBasicParsing = $true; Headers = $h }
  if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 6); $p.ContentType = 'application/json' }
  try {
    $r = Invoke-WebRequest @p
    $status = [int]$r.StatusCode; $text = $r.Content; $respHeaders = $r.Headers
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }                # server not reachable
    $status = [int]$resp.StatusCode; $text = $_.ErrorDetails.Message; $respHeaders = $resp.Headers
  }
  $json = $null
  if ($text) { try { $json = $text | ConvertFrom-Json } catch { $json = $null } }
  [pscustomobject]@{ Status = $status; Json = $json; Headers = $respHeaders }
}

function HeaderValue($h, [string]$name) {
  if ($h -and ($h.Keys -contains $name)) { return ($h[$name] -join ',') }
  return ''
}

function Check([string]$Name, $Ok, [string]$Detail = '') {
  if ($Ok) { $script:pass++; Write-Host "  PASS  $Name" -ForegroundColor Green }
  else { $script:fail++; Write-Host "  FAIL  $Name   $Detail" -ForegroundColor Red }
}

function Section([string]$Title) { Write-Host "`n== $Title ==" -ForegroundColor Cyan }

# ------------------------------------------------------------------ basics
Section 'Basics'
$r = Call 'GET' '/health'
Check 'Health endpoint is up and the database is connected' ($r.Status -eq 200 -and $r.Json.data.database -eq 'connected') "status=$($r.Status)"
Check 'No X-Powered-By header (server details hidden)' ((HeaderValue $r.Headers 'X-Powered-By') -eq '')
Check 'X-Content-Type-Options is nosniff (Helmet)' ((HeaderValue $r.Headers 'X-Content-Type-Options') -eq 'nosniff')

$r = Call 'GET' '/public/plans'
Check 'Public plans are listed' ($r.Status -eq 200 -and @($r.Json.data).Count -gt 0)

$r = Call 'GET' '/this-route-does-not-exist'
Check 'Unknown route returns a JSON 404' ($r.Status -eq 404 -and $r.Json.success -eq $false)

$r = Call 'GET' '/auth/me'
Check 'Protected route without a token returns 401' ($r.Status -eq 401)

$r = Call 'GET' '/health' -Extra @{ Origin = 'http://evil.example' }
Check 'CORS does not allow an unknown origin' ((HeaderValue $r.Headers 'Access-Control-Allow-Origin') -ne 'http://evil.example')

$r = Call 'POST' '/auth/login' @{ email = 'a@b.co'; password = ('x' * 20000) }
Check 'Oversized request body is rejected (413)' ($r.Status -eq 413) "status=$($r.Status)"

# ------------------------------------------------------------------ authentication
Section 'Authentication'
$admin = Call 'POST' '/auth/login' @{ email = $AdminEmail; password = $AdminPassword }
Check 'Admin can log in' ($admin.Status -eq 200 -and $admin.Json.data.accessToken) "status=$($admin.Status)"
$adminTok = $admin.Json.data.accessToken
if (-not $adminTok) { Write-Host '  Cannot continue without an admin token.' -ForegroundColor Red; exit 1 }

$r = Call 'POST' '/auth/login' @{ email = 'nobody@gym.local'; password = 'Wrong-Password-1!' }
Check 'Unknown account gets a generic 401' ($r.Status -eq 401 -and $r.Json.message -eq 'Invalid email or password')

$r = Call 'POST' '/auth/login' @{ email = "admin@gym.local' OR '1'='1"; password = 'x' }
Check 'SQL-injection style email is rejected by validation (400)' ($r.Status -eq 400)

$rand = -join ((97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$email = "smoke.$rand@smoke.gym.local"
$pw = 'Sm0ke!Test#Passw0rd'
$reg = Call 'POST' '/auth/register' @{ firstName = 'Smoke'; lastName = 'Test'; email = $email; password = $pw }
Check 'Registration works (201)' ($reg.Status -eq 201 -and $reg.Json.data.user.role -eq 'member') "status=$($reg.Status)"
$memberTok = $reg.Json.data.accessToken

$r = Call 'POST' '/auth/register' @{ firstName = 'Smoke'; lastName = 'Test'; email = $email; password = $pw }
Check 'Duplicate email is rejected (409)' ($r.Status -eq 409)

$r = Call 'POST' '/auth/register' @{ firstName = 'A'; lastName = 'B'; email = "weak.$rand@smoke.gym.local"; password = 'abc' }
Check 'Weak password is rejected (400)' ($r.Status -eq 400)

# ------------------------------------------------------------------ roles
Section 'Role permissions'
Check 'Member cannot use admin API (403)' ((Call 'GET' '/admin/members' $null $memberTok).Status -eq 403)
Check 'Member cannot use trainer API (403)' ((Call 'GET' '/trainer/members' $null $memberTok).Status -eq 403)
Check 'Admin can use admin API' ((Call 'GET' '/admin/dashboard' $null $adminTok).Status -eq 200)
Check 'Admin cannot use member API (403)' ((Call 'GET' '/member/profile' $null $adminTok).Status -eq 403)

$trainerTok = ''
if ($SamplePassword) {
  $t = Call 'POST' '/auth/login' @{ email = 'meera.iyer@sample.gym.local'; password = $SamplePassword }
  if ($t.Status -eq 200) { $trainerTok = $t.Json.data.accessToken }
}
if ($trainerTok) {
  Check 'Trainer can see own assigned members' ((Call 'GET' '/trainer/members' $null $trainerTok).Status -eq 200)
  Check 'Trainer cannot use admin API (403)' ((Call 'GET' '/admin/members' $null $trainerTok).Status -eq 403)
} else {
  Write-Host '  SKIP  Trainer checks (pass -SamplePassword after "npm run seed:sample")' -ForegroundColor Yellow
}

# ------------------------------------------------------------------ session (refresh cookie)
Section 'Session and refresh token'
$null = Invoke-RestMethod -Method Post -Uri "$Base/auth/login" -ContentType 'application/json' `
  -Body (@{ email = $email; password = $pw } | ConvertTo-Json) -SessionVariable sess

try { Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -WebSession $sess | Out-Null; $code = 200 }
catch { $code = [int]$_.Exception.Response.StatusCode }
Check 'Refresh without the X-Requested-With header is blocked (403)' ($code -eq 403) "status=$code"

try {
  $rf = Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -Headers $xhr -WebSession $sess
  $ok = [bool]$rf.data.accessToken
} catch { $ok = $false }
Check 'Refresh with the cookie returns a new access token' $ok

try { Invoke-RestMethod -Method Post -Uri "$Base/auth/logout" -Headers $xhr -WebSession $sess | Out-Null } catch { }
try { Invoke-RestMethod -Method Post -Uri "$Base/auth/refresh" -Headers $xhr -WebSession $sess | Out-Null; $code = 200 }
catch { $code = [int]$_.Exception.Response.StatusCode }
Check 'After logout the refresh token no longer works (401)' ($code -eq 401) "status=$code"

# ------------------------------------------------------------------ membership + payment workflow
Section 'Membership and payment workflow'
$q = [uri]::EscapeDataString($email)
$found = Call 'GET' "/admin/members?search=$q" $null $adminTok
$memberId = $found.Json.data[0].id
Check 'Admin can find the new member' ([bool]$memberId)

$plan = (Call 'GET' '/admin/plans' $null $adminTok).Json.data | Where-Object { $_.isActive -and $_.price -ge 2 } | Select-Object -First 1
if (-not $plan -or -not $memberId) {
  Write-Host '  SKIP  No active plan with price >= 2 (or member missing)' -ForegroundColor Yellow
} else {
  $half = [math]::Floor($plan.price / 2)
  $rest = $plan.price - $half

  $ms = Call 'POST' '/admin/memberships' @{ memberId = $memberId; planId = $plan.id; initialPayment = @{ amount = $half; method = 'cash' } } $adminTok
  Check 'Membership created together with a first payment (201)' ($ms.Status -eq 201) "status=$($ms.Status) $($ms.Json.message)"
  $m = $ms.Json.data
  Check 'Membership is active and partially paid' ($m.status -eq 'active' -and $m.paymentStatus -eq 'partial') "status=$($m.status)/$($m.paymentStatus)"

  $r = Call 'POST' '/admin/memberships' @{ memberId = $memberId; planId = $plan.id } $adminTok
  Check 'Overlapping membership is rejected (409)' ($r.Status -eq 409)

  $r = Call 'POST' '/admin/payments' @{ membershipId = $m.id; amount = ($plan.price * 2); method = 'upi' } $adminTok
  Check 'Payment above the balance is rejected (400)' ($r.Status -eq 400)

  $r = Call 'POST' '/admin/payments' @{ membershipId = $m.id; amount = $rest; method = 'upi'; transactionRef = "SMOKE-$rand" } $adminTok
  Check 'Paying the remaining balance works (201) and gives a receipt' ($r.Status -eq 201 -and $r.Json.data.receiptNo) "status=$($r.Status)"

  $m2 = (Call 'GET' "/admin/memberships/$($m.id)" $null $adminTok).Json.data
  Check 'Membership is now fully paid with balance 0' ($m2.paymentStatus -eq 'paid' -and $m2.balance -eq 0)

  $r = Call 'POST' '/admin/payments' @{ membershipId = $m.id; amount = 1; method = 'cash' } $adminTok
  Check 'No further payment is possible once paid (400)' ($r.Status -eq 400)

  # attendance
  Check 'Check-in works for a member with an active membership (201)' ((Call 'POST' '/admin/attendance/check-in' @{ memberId = $memberId } $adminTok).Status -eq 201)
  Check 'Second check-in on the same day is rejected (409)' ((Call 'POST' '/admin/attendance/check-in' @{ memberId = $memberId } $adminTok).Status -eq 409)
  Check 'Check-out works' ((Call 'POST' '/admin/attendance/check-out' @{ memberId = $memberId } $adminTok).Status -eq 200)

  # member self-service sees only own data
  $mine = Call 'GET' '/member/memberships' $null $memberTok
  Check 'Member sees own current membership' ($mine.Json.data.current.status -eq 'active')
  Check 'Member sees own 2 payments' (@((Call 'GET' '/member/payments' $null $memberTok).Json.data).Count -eq 2)

  if ($trainerTok) {
    Check 'Trainer cannot open a member who is not assigned to them (404)' ((Call 'GET' "/trainer/members/$memberId" $null $trainerTok).Status -eq 404)
  }

  # mass assignment: a member must not be able to change own status
  $r = Call 'PUT' '/member/profile' @{ city = 'Testville'; status = 'suspended' } $memberTok
  Check 'Member cannot change their own account status' ($r.Status -eq 200 -and $r.Json.data.status -eq 'active')

  # cleanup
  Section 'Cleanup'
  Check 'Smoke membership cancelled' ((Call 'PATCH' "/admin/memberships/$($m.id)/status" @{ status = 'cancelled' } $adminTok).Status -eq 200)
  Check 'Smoke member deleted' ((Call 'DELETE' "/admin/members/$memberId" $null $adminTok).Status -eq 200)
  $r = Call 'POST' '/auth/login' @{ email = $email; password = $pw }
  Check 'Deleted member can no longer log in (401)' ($r.Status -eq 401)
}

# ------------------------------------------------------------------ summary
$color = if ($script:fail) { 'Red' } else { 'Green' }
Write-Host "`nResult: $($script:pass) passed, $($script:fail) failed" -ForegroundColor $color
if ($script:fail) { exit 1 }