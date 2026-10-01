import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { validateService, type ServiceFormValues } from '../../../features/billing/schemas/service-schema'
import type { MedicalService } from '../../../features/billing/types/billing'
import type { Specialty } from '../../../features/doctors/types/doctor'

type Props = {
  service?: MedicalService | null
  specialties: Specialty[]
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (values: ServiceFormValues) => Promise<void>
}

const empty: ServiceFormValues = {
  code: '',
  name: '',
  description: '',
  price: '',
  specialtyId: '',
  durationMinutes: '30',
  isActive: true,
}

export default function ServiceForm({ service, specialties, submitting, apiError, onCancel, onSubmit }: Props) {
  const [values, setValues] = useState<ServiceFormValues>(() => service ? {
    code: service.code ?? '',
    name: service.name,
    description: service.description ?? '',
    price: String(service.price),
    specialtyId: service.specialtyId ? String(service.specialtyId) : '',
    durationMinutes: String(service.durationMinutes),
    isActive: service.isActive,
  } : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormValues, string>>>({})

  const update = (key: keyof ServiceFormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors = validateService(values)
    const specialty = specialties.find((item) => item.specialtyId === Number(values.specialtyId))
    if (specialty && !specialty.isActive) nextErrors.specialtyId = 'Hãy chọn một chuyên khoa đang hoạt động.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    await onSubmit(values)
  }
  const field = (key: keyof ServiceFormValues, label: string, options: { type?: string; placeholder?: string; required?: boolean; min?: number; max?: number; step?: number } = {}) => <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{options.required && ' *'}</span><input type={options.type ?? 'text'} value={String(values[key])} onChange={(event) => update(key, event.target.value)} placeholder={options.placeholder} min={options.min} max={options.max} step={options.step} className="input-base" />{errors[key] && <small className="mt-1 block text-rose-600">{errors[key]}</small>}</label>

  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="grid min-h-full place-items-center py-4"><form onSubmit={submit} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Danh mục dịch vụ</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{service ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ'}</h2></div><button type="button" onClick={onCancel} aria-label="Đóng" className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
      {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{apiError}</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {field('code', 'Mã dịch vụ', { placeholder: 'Ví dụ: XN-MAU' })}
        {field('name', 'Tên dịch vụ', { required: true, placeholder: 'Ví dụ: Xét nghiệm công thức máu' })}
        {field('price', 'Đơn giá', { type: 'number', required: true, min: 0, max: 9999999999.99, step: 1000 })}
        {field('durationMinutes', 'Thời lượng (phút)', { type: 'number', required: true, min: 5, max: 1440 })}
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Chuyên khoa</span><select value={values.specialtyId} onChange={(event) => update('specialtyId', event.target.value)} className="input-base"><option value="">Dùng chung cho mọi chuyên khoa</option>{specialties.map((item) => <option key={item.specialtyId} value={item.specialtyId} disabled={!item.isActive}>{item.name}{item.isActive ? '' : ' (ngừng hoạt động)'}</option>)}</select>{errors.specialtyId && <small className="mt-1 block text-rose-600">{errors.specialtyId}</small>}</label>
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span><textarea value={values.description} onChange={(event) => update('description', event.target.value)} maxLength={500} rows={4} className="input-base resize-none" placeholder="Mô tả ngắn về dịch vụ..." />{errors.description && <small className="mt-1 block text-rose-600">{errors.description}</small>}</label>
        {service && <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"><input type="checkbox" checked={values.isActive} onChange={(event) => update('isActive', event.target.checked)} className="size-4 accent-teal-700" /><span className="text-sm font-semibold text-slate-700">Dịch vụ đang hoạt động</span></label>}
      </div>
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : service ? 'Lưu thay đổi' : 'Tạo dịch vụ'}</Button></div>
    </form></div>
  </div>
}
