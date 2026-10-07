// Source contracts only. Real handlers are checked with the isolated browser fixture.
// No API calls, credentials, patient records or inventory writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const read = name => fs.readFileSync(path.join(__dirname, '..', 'src/workspaces/pharmacy/pages', name + '.tsx'), 'utf8')
for (const name of ['PharmacyReceiptPage', 'PharmacyDispensePage']) {
  const source = read(name)
  check(source.includes("import { notify } from '../../../shared/notifications/notify'"), `${name}: shared adapter`)
  check(!source.includes("type: 'success'"), `${name}: no duplicate success banner`)
  check(source.includes('role="alert"') && source.includes('displayError(error,'), `${name}: contextual errors retained`)
  check(!source.includes('<AppToaster') && !source.includes('toast.'), `${name}: no second toaster`)
  check(source.includes('mutationPending.current = true') && source.includes('mutationPending.current = false'), `${name}: local pending guard released`)
  const messages = [...source.matchAll(/notify\.(?:success|info)\('([^']+)'\)/g)].map(match => match[1])
  check(messages.length > 0 && messages.every(message => /[À-ỹ]/u.test(message) && !/patientName|SqlClient|#/.test(message)), `${name}: generic accented messages`)
}
const receipt = read('PharmacyReceiptPage')
check(/await pharmacyApi.receiveReceipt\([\s\S]*?setReceipt\([\s\S]*?notify.success/.test(receipt), 'Receipt result precedes success notification')
check(receipt.includes('new Set(keys).size !== keys.length') && receipt.includes('toLowerCase()'), 'Duplicate lot validation retained')
check(receipt.includes('medicines.error && !receipt') && receipt.includes('Thử tải lại danh sách thuốc'), 'Catalog load error has inline retry')
check(receipt.includes('disabled={saving || medicines.loading || !!medicines.error}'), 'Pending or failed catalog blocks submission')
check(receipt.includes('receipt.items.map') && receipt.includes('Tạo phiếu mới'), 'Saved receipt details and reset retained')
const dispense = read('PharmacyDispensePage')
check(/await pharmacyApi.dispense\([\s\S]*?if \(response.alreadyDispensed\) notify.info[\s\S]*?else notify.success/.test(dispense), 'Previously dispensed response is informational, not new success')
check(dispense.includes('result?.alreadyDispensed && result.prescriptionId === Number(id)') && dispense.includes('không phải lần xuất kho mới'), 'Previously recorded result has persistent context')
check(dispense.includes('detail?.canDispense && !query.loading && !query.error && !busy && !result'), 'Stock, pending and result guards retained')
check(dispense.includes('query.data?.prescriptionId === requestedId') && dispense.includes('Number(id) === requestedId'), 'Stale prescription identity guard retained')
check(dispense.includes('detail.blockedReason') && dispense.includes('<BatchAllocationTable items={detail.items} />'), 'Stock warnings and allocation remain visible')
check(/finally \{[\s\S]*?query.refresh\(\)/.test(dispense), 'Re-read after success or conflict retained')
check(dispense.includes('result.lines.map') && dispense.includes('Phát đơn khác'), 'Dispensing result details retained')
console.log(`Pharmacy notifications: ${checks} source contracts passed. Not production E2E; see browser DEMO.`)
