import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '../../../components/ui'
import { validateSpecialty } from '../../../features/doctors/schemas/doctor-schema'
import type { Specialty } from '../../../features/doctors/types/doctor'

type Props = {
  specialty?: Specialty | null
  submitting: boolean
  apiError?: string
  onCancel: () => void
  onSubmit: (values: { name: string; description?: string; isActive?: boolean }) => Promise<void>
}

export default function SpecialtyForm({ specialty, submitting, apiError, onCancel, onSubmit }: Props) {
  const [name, setName] = useState(specialty?.name ?? '')
  const [description, setDescription] = useState(specialty?.description ?? '')
  const [isActive, setIsActive] = useState(specialty?.isActive ?? true)
  const [nameError, setNameError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validation = validateSpecialty(name)
    setNameError(validation)
    if (validation) return
    await onSubmit({ name: name.trim(), description: description.trim() || undefined, isActive })
  }

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Danh mục chuyên khoa</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-900">{specialty ? 'Cập nhật chuyên khoa' : 'Thêm chuyên khoa'}</h2></div><button type="button" onClick={onCancel} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div>
      {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="size-5 shrink-0" />{apiError}</div>}
      <label className="mt-6 block"><span className="mb-2 block text-sm font-semibold text-slate-700">Tên chuyên khoa *</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); setNameError('') }} maxLength={255} className="input-base" placeholder="Ví dụ: Tim mạch" />{nameError && <small className="mt-1 block text-rose-600">{nameError}</small>}</label>
      <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="input-base resize-none" placeholder="Mô tả phạm vi chuyên môn..." /></label>
      {specialty && <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 accent-teal-700" /><span className="text-sm font-semibold text-slate-700">Chuyên khoa đang hoạt động</span></label>}
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : specialty ? 'Lưu thay đổi' : 'Tạo chuyên khoa'}</Button></div>
    </form>
  </div>
}
