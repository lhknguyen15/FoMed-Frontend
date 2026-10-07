import { useId, useState } from 'react'
import { Button } from '../../../components/ui'
import { validateMedicine, type MedicineFormErrors, type MedicineFormValues } from '../../../features/pharmacy/schemas/medicine-schema'
import type { MedicineCatalogRow } from '../../../features/pharmacy/types/medicine-catalog'
import MedicineDialog from './MedicineDialog'

export default function MedicineForm({ medicine, busy, error, onClose, onSubmit }: {
  medicine: MedicineCatalogRow | null; busy: boolean; error: string; onClose: () => void
  onSubmit: (values: MedicineFormValues) => Promise<void>
}) {
  const prefix = useId()
  const [values, setValues] = useState<MedicineFormValues>(() => ({ name: medicine?.name ?? '', unit: medicine?.unit ?? '', price: medicine ? String(medicine.price) : '', description: medicine?.description ?? '' }))
  const [errors, setErrors] = useState<MedicineFormErrors>({})
  const update = (key: keyof MedicineFormValues, value: string) => { setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const next = validateMedicine(values); setErrors(next)
    if (!Object.keys(next).length) await onSubmit(values)
  }
  const field = (key: 'name' | 'unit' | 'price', label: string, maxLength?: number) => <label className="block"><span className="field-label">{label} *</span><input className="input-base" value={values[key]} onChange={event => update(key, event.target.value)} maxLength={maxLength} inputMode={key === 'price' ? 'decimal' : undefined} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${prefix}-${key}-error` : undefined} />{errors[key] && <small id={`${prefix}-${key}-error`} className="mt-1 block text-rose-600">{errors[key]}</small>}</label>
  return <MedicineDialog title={medicine ? 'Cập nhật thuốc' : 'Thêm thuốc'} busy={busy} onClose={onClose}>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <form noValidate onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
      {field('name', 'Tên thuốc', 255)}
      <div className="grid gap-4 sm:grid-cols-2">{field('unit', 'Đơn vị', 50)}{field('price', 'Giá bán mỗi đơn vị')}</div>
      <p className="text-xs text-slate-500">Ví dụ đơn vị: viên, chai hoặc hộp. Nhập giá bằng đồng; dùng dấu chấm nếu có phần thập phân.</p>
      {medicine && <p className="text-xs text-amber-800">Thuốc đã có lô kho hoặc chứng từ không thể đổi đơn vị, để giữ đúng số lượng đã lưu.</p>}
      <label className="block"><span className="field-label">Mô tả</span><textarea rows={3} maxLength={500} value={values.description} onChange={event => update('description', event.target.value)} className="input-base resize-y" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? `${prefix}-description-error` : undefined} />{errors.description && <small id={`${prefix}-description-error`} className="mt-1 block text-rose-600">{errors.description}</small>}</label>
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{medicine ? 'Giá mới áp dụng cho các lần kê đơn tiếp theo. Giá đã lưu trên đơn thuốc và hóa đơn không thay đổi.' : 'Thêm thuốc chỉ tạo danh mục, không tự tăng tồn kho. Nhập lô thuốc tại chức năng kho thuốc.'}</p>
      <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit">{busy ? 'Đang lưu...' : 'Lưu thuốc'}</Button></div>
    </fieldset></form>
  </MedicineDialog>
}
