param(
    [Parameter(Mandatory = $true)] [System.Security.SecureString]$DemoPassword,
    [ValidateSet('Unpaid', 'Settled')] [string]$Stage = 'Settled'
)

# Read-back for the single UI-created demo journey, not a fixture/seeding runner.
# No clinical/billing/pharmacy writes or DELETE. POST is used only for login.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$verifyClient = [System.Net.Http.HttpClient]::new()
$verifyClient.Timeout = [TimeSpan]::FromSeconds(45)
$verifyBase = 'https://fomed-api.onrender.com'
$verifyCredential = [System.Net.NetworkCredential]::new('', $DemoPassword)
$verifyTokens = @{}
$verifyChecks = [System.Collections.Generic.List[object]]::new()
$recordId = 1004
$appointmentCode = 'AP0000000659'
$invoiceId = 185
$marker = '[DEMO-CLOUD-20261006-1300]'

function Assert-Workflow([bool]$ok, [string]$label) {
    $verifyChecks.Add([pscustomobject]@{ passed = $ok; label = $label })
    if ($ok) { Write-Output ('PASS: ' + $label) }
    else { Write-Output ('FAIL: ' + $label) }
}

function Read-Cloud([string]$path, [string]$token) {
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $verifyBase + $path)
    $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token)
    $response = $null
    try {
        $response = $verifyClient.SendAsync($request).GetAwaiter().GetResult()
        $raw = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $json = $null
        if ($raw) { try { $json = $raw | ConvertFrom-Json } catch {} }
        $data = $json
        if ($null -ne $json -and $null -ne $json.PSObject.Properties['dataResponse']) { $data = $json.dataResponse }
        return [pscustomobject]@{ status = [int]$response.StatusCode; data = $data }
    } finally { if ($response) { $response.Dispose() }; $request.Dispose() }
}

try {
    foreach ($account in @('admin', 'bs.an', 'patient01', 'patient02', 'ktv.linh')) {
        $content = [System.Net.Http.StringContent]::new(
            (@{ username = $account; password = $verifyCredential.Password } | ConvertTo-Json -Compress),
            [System.Text.Encoding]::UTF8, 'application/json')
        $response = $null
        try {
            $response = $verifyClient.PostAsync($verifyBase + '/api/auth/login', $content).GetAwaiter().GetResult()
            if ([int]$response.StatusCode -ne 200) { throw ('Demo login failed for ' + $account + '; no response contents printed.') }
            $session = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
            $verifyTokens[$account] = $session.dataResponse.accessToken
        } finally { if ($response) { $response.Dispose() }; $content.Dispose(); $session = $null }
    }

    $record = Read-Cloud "/api/clinical/records/$recordId" $verifyTokens['bs.an']
    Assert-Workflow ($record.status -eq 200 -and $record.data.id -eq $recordId -and $record.data.appointmentId -gt 0 -and $record.data.diagnosis.StartsWith($marker)) 'Exact UI-created demo record identity'
    if ($record.status -ne 200 -or !$record.data.diagnosis.StartsWith($marker)) { throw 'Demo identity does not match; stopping read-back.' }
    # Human appointment code comes from a sequence, not the row identity.
    $appointmentId = $record.data.appointmentId
    Assert-Workflow ($record.data.isFinalized -and $null -ne $record.data.finalizedAt) 'Record finalized and timestamp persisted'
    $vitals = $record.data.vitalSigns
    Assert-Workflow ($vitals.systolic -eq 120 -and $vitals.diastolic -eq 80 -and $vitals.heartRate -eq 72 -and $vitals.temperature -eq 36.5 -and $vitals.weightKg -eq 65 -and $vitals.heightCm -eq 170) 'All six vital values persisted'
    $appointment = Read-Cloud "/api/appointments/$appointmentId" $verifyTokens['patient01']
    Assert-Workflow ($appointment.status -eq 200 -and $appointment.data.appointmentCode -eq $appointmentCode -and $appointment.data.status -eq 3 -and $appointment.data.reason.StartsWith($marker) -and $appointment.data.checkedInAt -and $appointment.data.queueNumber -eq 1) 'Appointment completed after confirmed check-in'
    Assert-Workflow ($appointment.data.feeSnapshot -eq 150000) 'Booking consultation fee snapshot persisted'
    $orders = Read-Cloud "/api/clinical/records/$recordId/services" $verifyTokens['bs.an']
    $completed = @($orders.data | Where-Object id -eq 1005)
    $canceled = @($orders.data | Where-Object id -eq 1006)
    Assert-Workflow ($orders.status -eq 200 -and $completed.Count -eq 1 -and $completed[0].status -eq 1 -and $completed[0].unitPriceSnapshot -eq 120000 -and $completed[0].resultSummary.StartsWith($marker)) 'Completed order and result snapshot persisted'
    Assert-Workflow ($canceled.Count -eq 1 -and $canceled[0].status -eq 2 -and $canceled[0].unitPriceSnapshot -eq 90000) 'Canceled order preserved without deleting history'
    # History keyword searches patient/service, not the result summary marker.
    $history = Read-Cloud '/api/clinical/lab-results?page=1' $verifyTokens['ktv.linh']
    Assert-Workflow ($history.status -eq 200 -and @($history.data.items | Where-Object { $_.order.id -eq 1005 }).Count -eq 1) 'Technician history contains exact result'
    $rx = Read-Cloud "/api/clinical/records/$recordId/prescription" $verifyTokens['bs.an']
    Assert-Workflow ($rx.status -eq 200 -and $rx.data.note.StartsWith($marker) -and $rx.data.items.Count -eq 1 -and $rx.data.items[0].quantity -eq 2 -and $rx.data.items[0].unitPriceSnapshot -eq 1000) 'Prescription quantity and medicine price snapshot persisted'
    Write-Output ('Demo prescription ID: ' + $rx.data.id)
    $invoice = Read-Cloud "/api/invoices/$invoiceId" $verifyTokens['admin']
    Assert-Workflow ($invoice.status -eq 200 -and $invoice.data.medicalRecordId -eq $recordId -and $invoice.data.totalAmount -eq 272000 -and $invoice.data.consultationFee -eq 150000 -and $invoice.data.items.Count -eq 2) 'Invoice equals consultation + completed test + medicine'
    Assert-Workflow (@($invoice.data.items | Where-Object unitPrice -eq 90000).Count -eq 0) 'Canceled ECG price excluded from invoice'
    $patientInvoice = Read-Cloud "/api/invoices/$invoiceId" $verifyTokens['patient01']
    $patientRecord = Read-Cloud "/api/clinical/records/$recordId" $verifyTokens['patient01']
    Assert-Workflow ($patientInvoice.status -eq 200 -and $patientInvoice.data.totalAmount -eq 272000 -and $patientRecord.status -eq 200 -and $patientRecord.data.isFinalized) 'Owner patient reads exact invoice and finalized record'
    $otherInvoice = Read-Cloud "/api/invoices/$invoiceId" $verifyTokens['patient02']
    $otherRecord = Read-Cloud "/api/clinical/records/$recordId" $verifyTokens['patient02']
    Assert-Workflow ($otherInvoice.status -eq 403 -and $otherRecord.status -eq 403) 'Another patient denied invoice and medical record'
    $report = Read-Cloud ('/api/reports/summary?from=2026-10-06&to=2026-10-07&doctorId=' + $record.data.doctorId) $verifyTokens['admin']
    Assert-Workflow ($report.status -eq 200 -and $report.data.completedAppointments -ge 1 -and $report.data.invoicedAmount -ge 272000) 'Doctor/day report includes completed journey and issued invoice'
    Write-Output ('Demo day report: invoiced={0}; collected={1}; outstanding={2}' -f $report.data.invoicedAmount, $report.data.collectedAmount, $report.data.outstandingAmount)
    $audit = Read-Cloud '/api/audit-logs?entity=MedicalRecord&action=Finalize&page=1&pageSize=10' $verifyTokens['admin']
    Assert-Workflow ($audit.status -eq 200 -and @($audit.data.items | Where-Object { [string]$_.entityId -eq [string]$recordId }).Count -eq 1) 'Finalization audit contains exact demo record'
    # No isolated Pharmacist demo account exists on this cloud snapshot.
    # Do not borrow a personal account or create privileged credentials here.

    if ($Stage -eq 'Unpaid') {
        Assert-Workflow ($invoice.data.paidAmount -eq 0 -and $invoice.data.remainingAmount -eq 272000 -and $invoice.data.payments.Count -eq 0) 'Unpaid invoice has full debt and no payment'
        Assert-Workflow ($report.data.collectedAmount -eq 0 -and $report.data.outstandingAmount -ge 272000) 'Issued invoice is debt, not actual revenue'
        Assert-Workflow (!$rx.data.isDispensed) 'No dispensing performed during this scoped journey'
    } else {
        Assert-Workflow ($invoice.data.status -eq 1 -and $invoice.data.paidAmount -eq 272000 -and $invoice.data.remainingAmount -eq 0 -and $invoice.data.payments.Count -eq 1) 'Settled invoice has exactly one payment and zero debt'
        $payment = $invoice.data.payments[0]
        Assert-Workflow ($payment.amount -eq 272000 -and $payment.cashReceived -eq 300000 -and $payment.changeAmount -eq 28000 -and $payment.receivedBy -gt 0 -and $payment.receivedByName -and $payment.idempotencyKey) 'Cash received/change/collector/idempotency metadata persisted'
        Assert-Workflow ($report.data.collectedAmount -ge 272000 -and $report.data.outstandingAmount -eq 0) 'Actual revenue uses net payment, not tendered cash'
        Assert-Workflow (!$rx.data.isDispensed) 'No pharmacy stock mutation performed'
    }
    $failures = @($verifyChecks | Where-Object { !$_.passed }).Count
    Write-Output ('Cloud workflow read-back ({0}): {1} passed, {2} failed. No clinical/billing mutations performed by this script.' -f $Stage, ($verifyChecks.Count - $failures), $failures)
    if ($failures) { throw 'Read-back assertions failed; review check labels without printing private response bodies.' }
} finally { $verifyClient.Dispose(); $verifyCredential = $null; $verifyTokens.Clear(); $DemoPassword = $null }
