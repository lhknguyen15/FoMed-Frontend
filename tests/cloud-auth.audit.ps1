param(
    [Parameter(Mandatory = $true)]
    [System.Security.SecureString]$DemoPassword
)

# Explicitly scoped to the existing FoMed cloud demo. Login/refresh writes only
# authentication sessions. No account changes, patient records or payments.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$auditClient = [System.Net.Http.HttpClient]::new()
$auditClient.Timeout = [TimeSpan]::FromSeconds(30)
$auditBase = 'https://fomed-api.onrender.com'
$auditChecks = [System.Collections.Generic.List[object]]::new()
$auditCredential = [System.Net.NetworkCredential]::new('', $DemoPassword)

function Check-Auth([bool]$ok, [string]$label) {
    $auditChecks.Add([pscustomobject]@{ passed = $ok; label = $label })
    if ($ok) { Write-Output ('PASS: ' + $label) }
    else { Write-Output ('FAIL: ' + $label) }
}

function Request-Auth([string]$method, [string]$path, [string]$token = '', [object]$payload = $null) {
    $request = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::new($method), ($auditBase + $path))
    $reply = $null
    try {
        if ($token) {
            $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token)
        }
        if ($null -ne $payload) {
            $request.Content = [System.Net.Http.StringContent]::new(
                ($payload | ConvertTo-Json -Compress), [System.Text.Encoding]::UTF8, 'application/json')
        }
        $reply = $auditClient.SendAsync($request).GetAwaiter().GetResult()
        $body = $reply.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $json = $null
        if ($body) { try { $json = $body | ConvertFrom-Json } catch {} }
        return [pscustomobject]@{ status = [int]$reply.StatusCode; json = $json }
    }
    finally {
        if ($null -ne $reply) { $reply.Dispose() }
        $request.Dispose()
    }
}

try {
    foreach ($path in @('/api/profile', '/api/admin/users')) {
        $reply = Request-Auth 'GET' $path
        Check-Auth ($reply.status -eq 401) ('Anonymous denied ' + $path)
    }
    $reply = Request-Auth 'GET' '/api/profile' 'invalid.audit.jwt'
    Check-Auth ($reply.status -eq 401) 'Malformed JWT denied'

    foreach ($account in @(
        @{ user = 'admin'; role = 'Admin'; allowed = '/api/admin/users?page=1&pageSize=1'; denied = '/api/appointments/doctor-queue' },
        @{ user = 'letan01'; role = 'Receptionist'; allowed = '/api/appointments/staff-appointments'; denied = '/api/admin/users' },
        @{ user = 'bs.an'; role = 'Doctor'; allowed = '/api/appointments/doctor-queue'; denied = '/api/admin/users' },
        @{ user = 'patient01'; role = 'Patient'; allowed = '/api/appointments/my-appointments'; denied = '/api/admin/users' }
    )) {
        $login = Request-Auth 'POST' '/api/auth/login' '' @{
            username = $account.user; password = $auditCredential.Password
        }
        Check-Auth ($login.status -eq 200) ($account.role + ' login')
        if ($login.status -ne 200) { continue }
        $session = $login.json.dataResponse
        Check-Auth (@($session.user.roles) -contains $account.role) ($account.role + ' response role')

        $profile = Request-Auth 'GET' '/api/profile' $session.accessToken
        Check-Auth ($profile.status -eq 200 -and $profile.json.dataResponse.userId -eq $session.user.id) ($account.role + ' own profile')
        $allowed = Request-Auth 'GET' $account.allowed $session.accessToken
        Check-Auth ($allowed.status -eq 200) ($account.role + ' allowed endpoint')
        $denied = Request-Auth 'GET' $account.denied $session.accessToken
        Check-Auth ($denied.status -eq 403) ($account.role + ' wrong-role endpoint denied')

        $refresh = Request-Auth 'POST' '/api/auth/refresh' '' @{ refreshToken = $session.refreshToken }
        Check-Auth ($refresh.status -eq 200) ($account.role + ' refresh')
        if ($refresh.status -eq 200) {
            $newSession = $refresh.json.dataResponse
            Check-Auth ($newSession.refreshToken -ne $session.refreshToken -and $newSession.user.id -eq $session.user.id) ($account.role + ' refresh rotated for same user')
            $replay = Request-Auth 'POST' '/api/auth/refresh' '' @{ refreshToken = $session.refreshToken }
            Check-Auth ($replay.status -eq 401) ($account.role + ' old refresh replay denied')
            $newProfile = Request-Auth 'GET' '/api/profile' $newSession.accessToken
            Check-Auth ($newProfile.status -eq 200 -and $newProfile.json.dataResponse.userId -eq $session.user.id) ($account.role + ' refreshed JWT works')
        }
    }
    $failed = @($auditChecks | Where-Object { -not $_.passed }).Count
    Write-Output ('Cloud auth: {0} passed, {1} failed. Only authentication sessions changed; no credentials or account values printed.' -f ($auditChecks.Count - $failed), $failed)
    if ($failed -gt 0) { throw 'Cloud authentication assertions failed. See check labels, not credentials.' }
}
finally {
    $auditClient.Dispose()
    $auditCredential = $null
    $session = $null
    $newSession = $null
    $login = $null
    $refresh = $null
}
