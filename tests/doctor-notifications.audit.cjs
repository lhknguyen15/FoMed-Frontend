// Source contract checks only; actual handlers are exercised in the isolated browser fixture.
// No API, credentials, patients or data writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const read = name => fs.readFileSync(path.join(__dirname, '..', 'src/workspaces/doctor/pages', name + '.tsx'), 'utf8')
for (const name of ['DoctorExamPage', 'DoctorPrescriptionPage', 'DoctorServicesPage']) {
  const source = read(name)
  check(source.includes("import { notify } from '../../../shared/notifications/notify'"), `${name}: shared notification adapter`)
  check(!source.includes("type: 'success'"), `${name}: no duplicate inline success banner`)
  check(source.includes('role="alert"') && source.includes('displayError(error,'), `${name}: contextual inline errors retained`)
  check(!source.includes('<AppToaster') && !source.includes('toast.'), `${name}: no second toaster or bypass of adapter`)
  const messages = [...source.matchAll(/notify\.success\('([^']+)'\)/g)].map(match => match[1])
  check(messages.length > 0 && messages.every(message => /[À-ỹ]/u.test(message) && !/patientName|diagnosis|DEMO|#|SqlClient/.test(message)), `${name}: generic accented operation messages`)
}
const exam = read('DoctorExamPage')
check(/await clinicalApi\.updateRecord\(id, form\); notify\.success\('Đã lưu thông tin bệnh án.'\)/.test(exam), 'Record success occurs after update resolves')
check(/await clinicalApi\.updateRecord\(id, form\); await appointmentApi\.complete\(record.data!\.appointmentId\); notify\.success/.test(exam), 'Finalize success occurs only after both operations resolve')
check(exam.includes('mutationPending.current') && exam.includes('record.data?.id !== id'), 'Record pending and stale identity guards preserved')
const prescription = read('DoctorPrescriptionPage')
check(/if \(prescription.data\) await clinicalApi.updatePrescription\(id, request\)\s+else await clinicalApi.createPrescription\(id, request\)\s+notify.success/.test(prescription), 'Create and update prescription succeed before notification')
check(prescription.includes('if (allergies && !ack)') && prescription.includes('line.quantity > (medicineFor(line.medicineId)?.availableQuantity ?? 0)'), 'Allergy acknowledgement and stock guards preserved')
check(prescription.includes("if (error.message.includes('cấp phát')) prescription.refresh()"), 'Stock conflicts preserve unsaved lines; dispensing locks refresh them')
check(prescription.includes('Đơn thuốc đã được cấp phát, không thể chỉnh sửa.') && prescription.includes('Bệnh án đã chốt, chỉ có thể xem lại đơn thuốc.'), 'Clinical locked-state notices stay persistent')
const services = read('DoctorServicesPage')
check(/await clinicalApi.orderService\([\s\S]*?notify.success\('Đã thêm chỉ định/.test(services), 'Service success follows completed add')
check(/await clinicalApi.cancelOrder\(orderId\)\s+setCancelingId\(null\)\s+notify.success/.test(services), 'Cancel closes dialog and announces only after success')
check(services.includes('notice && cancelingId === null') && /aria-labelledby="cancel-order-title"[\s\S]*?role="alert"/.test(services), 'Cancel errors are visible inside dialog, not behind overlay')
check(services.includes('Number.isInteger(requestedQuantity)') && services.includes('requestedQuantity > 1000'), 'Service quantity validation preserved')
console.log(`Doctor notifications: ${checks} source contracts passed. Not deployed E2E; see browser DEMO.`)
