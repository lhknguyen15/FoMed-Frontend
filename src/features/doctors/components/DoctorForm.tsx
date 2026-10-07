import type { DoctorPublicProfileValues } from '../schemas/doctor-schema'

export default function DoctorForm({ values, errors, onChange, disabled = false }: {
  values: DoctorPublicProfileValues
  errors: Partial<Record<keyof DoctorPublicProfileValues, string>>
  onChange: (key: keyof DoctorPublicProfileValues, value: string) => void
  disabled?: boolean
}) {
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="mb-3 text-sm font-bold text-slate-800">Hồ sơ công khai</legend>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="field-label">Liên kết ảnh đại diện</span><input type="url" maxLength={2048} value={values.avatarUrl} onChange={(event) => onChange('avatarUrl', event.target.value)} placeholder="https://..." className="input-base" />{errors.avatarUrl && <small className="mt-1 block text-rose-600">{errors.avatarUrl}</small>}</label>
      <label><span className="field-label">Năm bắt đầu hành nghề</span><input type="number" min={1900} max={new Date().getUTCFullYear()} step={1} value={values.practiceStartYear} onChange={(event) => onChange('practiceStartYear', event.target.value)} className="input-base" />{errors.practiceStartYear && <small className="mt-1 block text-rose-600">{errors.practiceStartYear}</small>}</label>
    </div>
    <label className="block"><span className="field-label">Giới thiệu</span><textarea rows={5} maxLength={5000} value={values.biography} onChange={(event) => onChange('biography', event.target.value)} placeholder="Giới thiệu về chuyên môn và quá trình hành nghề..." className="input-base resize-y" /><span className="mt-1 block text-right text-xs text-slate-400">{values.biography.length}/5000</span>{errors.biography && <small className="mt-1 block text-rose-600">{errors.biography}</small>}</label>
  </fieldset>
}
