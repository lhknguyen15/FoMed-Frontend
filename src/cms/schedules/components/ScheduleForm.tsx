import { useState } from 'react'
import { Button } from '../../../components/ui'
import type { AdminDoctorSchedule } from '../../../features/schedules/types/schedule'
import type { ScheduleDoctorChoice } from '../../../features/schedules/types/schedule'
import { scheduleValidation } from '../../../features/schedules/schemas/schedule-schema'
import ScheduleDialog from './ScheduleDialog'

type Props = {
  schedule?: AdminDoctorSchedule | null
  doctors: ScheduleDoctorChoice[]
  submitting: boolean
  error?: string
  onCancel: () => void
  onSubmit: (value: { doctorId: number; dayOfWeeks: number[]; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }) => Promise<void>
}

const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export default function ScheduleForm({ schedule, doctors, submitting, error, onCancel, onSubmit }: Props) {
  const [doctorId, setDoctorId] = useState(String(schedule?.doctorId ?? ''))
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule ? [schedule.dayOfWeek] : [])
  const [startTime, setStartTime] = useState(schedule?.startTime.slice(0, 5) ?? '08:00')
  const [endTime, setEndTime] = useState(schedule?.endTime.slice(0, 5) ?? '12:00')
  const [slotMinutes, setSlotMinutes] = useState(String(schedule?.slotMinutes ?? 30))
  const [isActive, setIsActive] = useState(schedule?.isActive ?? true)
  const [validation, setValidation] = useState('')

  const toggleDay = (day: number) => setSelectedDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort((a, b) => a - b))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const value = { doctorId: Number(doctorId), dayOfWeeks: selectedDays, startTime, endTime, slotMinutes: Number(slotMinutes), isActive }
    const message = scheduleValidation(value)
    if (message) {
      setValidation(message)
      return
    }
    setValidation('')
    await onSubmit(value)
  }

  return <ScheduleDialog title={schedule ? 'Cập nhật khung giờ' : 'Thêm khung giờ làm việc'} busy={submitting} onClose={onCancel}><form onSubmit={submit}>
    <p className="text-sm text-slate-500">{schedule ? 'Cập nhật riêng ngày đang chọn.' : 'Chọn nhiều ngày có cùng giờ làm việc trong một lần.'} Lịch hẹn đã đặt không tự chuyển hoặc hủy khi thay đổi ca.</p>
    {(error || validation) && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error || validation}</p>}
    <fieldset disabled={submitting} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Bác sĩ *</span><select required value={doctorId} onChange={event => setDoctorId(event.target.value)} className="input-base"><option value="">Chọn bác sĩ</option>{doctors.filter(doctor => doctor.isActive || doctor.doctorId === schedule?.doctorId).map(doctor => <option key={doctor.doctorId} value={doctor.doctorId}>{doctor.title ? `${doctor.title} ` : ''}{doctor.fullName}{!doctor.isActive ? ' (ngừng hoạt động)' : ''}</option>)}</select></label>
      {schedule ? <label className="block"><span className="mb-2 block text-sm font-semibold">Ngày trong tuần *</span><select value={selectedDays[0] ?? ''} onChange={event => setSelectedDays([Number(event.target.value)])} className="input-base">{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label> : <fieldset><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><legend className="text-sm font-semibold">Ngày làm việc *</legend><div className="flex gap-2"><button type="button" onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6])} className="text-xs font-semibold text-teal-700 hover:underline">Chọn Thứ 2–Thứ 7</button><button type="button" onClick={() => setSelectedDays([])} className="text-xs font-semibold text-slate-500 hover:underline">Bỏ chọn</button></div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{days.map((day, index) => <label key={day} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${selectedDays.includes(index) ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><input type="checkbox" checked={selectedDays.includes(index)} onChange={() => toggleDay(index)} />{day}</label>)}</div></fieldset>}
      <div className="grid gap-4 sm:grid-cols-3"><label className="block"><span className="mb-2 block text-sm font-semibold">Bắt đầu *</span><input type="time" required value={startTime} onChange={event => setStartTime(event.target.value)} className="input-base" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Kết thúc *</span><input type="time" required value={endTime} onChange={event => setEndTime(event.target.value)} className="input-base" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Thời lượng mỗi lượt (phút)</span><input type="number" min={5} max={240} value={slotMinutes} onChange={event => setSlotMinutes(event.target.value)} className="input-base" /></label></div>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} />Đang áp dụng để nhận lịch hẹn</label>
    </fieldset>
    <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu…' : schedule ? 'Lưu thay đổi' : `Tạo ${selectedDays.length || ''} ngày làm việc`}</Button></div>
  </form></ScheduleDialog>
}
