import type { SaveMedicineInput } from '../types/medicine-catalog'

export type MedicineFormValues = { name: string; unit: string; price: string; description: string }
export type MedicineFormErrors = Partial<Record<keyof MedicineFormValues, string>>
const hasControl = (value: string) => [...value].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)

export function validateMedicine(values: MedicineFormValues): MedicineFormErrors {
  const errors: MedicineFormErrors = {}
  const name = values.name.trim().normalize('NFC'); const unit = values.unit.trim().normalize('NFC')
  if (!name || name.length > 255 || hasControl(name)) errors.name = 'Tên thuốc phải có từ 1 đến 255 ký tự hợp lệ.'
  if (!unit || unit.length > 50 || hasControl(unit)) errors.unit = 'Đơn vị thuốc phải có từ 1 đến 50 ký tự hợp lệ.'
  const price = values.price.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price)) || Number(price) > 9999999999.99)
    errors.price = 'Giá bán phải từ 0 đến 9.999.999.999,99 đồng, tối đa hai chữ số thập phân.'
  const description = values.description.trim().normalize('NFC')
  if (description.length > 500 || hasControl(description.replace(/[\n\r\t]/g, '')))
    errors.description = 'Mô tả thuốc phải không quá 500 ký tự hợp lệ.'
  return errors
}

export function medicineInput(values: MedicineFormValues): SaveMedicineInput {
  return { name: values.name.trim().normalize('NFC'), unit: values.unit.trim().normalize('NFC'),
    price: Number(values.price), description: values.description.trim().normalize('NFC') || undefined }
}
