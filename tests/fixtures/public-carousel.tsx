import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import PublicCatalogCarousel from '../../src/workspaces/public/components/PublicCatalogCarousel'
import { DoctorPreviewCard, SpecialtyPreviewCard } from '../../src/workspaces/public/components/PublicCatalogCards'
import '../../src/index.css'

// UI-only synthetic catalog. No API, authentication or database writes.
export function Preview() {
  const [single, setSingle] = useState(false)
  const specialties = Array.from({ length: single ? 1 : 12 }, (_, index) => ({ specialtyId: index + 1, name: 'Chuyên khoa minh họa ' + (index + 1) }))
  const doctors = Array.from({ length: single ? 1 : 11 }, (_, index) => ({ doctorId: index + 1, specialtyId: index + 1, specialtyName: 'Chuyên khoa minh họa ' + (index + 1), fullName: 'Bác sĩ minh họa ' + (index + 1), consultationFee: 150000 }))
  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <h1 className="text-lg font-bold text-slate-900">Kiểm tra giao diện · Dữ liệu minh họa, không phải danh mục thật</h1>
    <button type="button" onClick={() => setSingle(!single)} className="mt-4 rounded-xl border border-teal-300 bg-white px-4 py-2 text-teal-800">{single ? 'Hiển thị nhiều lựa chọn' : 'Hiển thị một lựa chọn'}</button>
    <section id="specialties" className="mt-8 rounded-2xl bg-[#edf8f4] py-5">
      <h2 className="px-6 text-2xl font-bold text-slate-900">Chăm sóc đúng nhu cầu của bạn</h2>
      <PublicCatalogCarousel label="chuyên khoa" variant="specialties">{specialties.map((specialty, index) => <SpecialtyPreviewCard key={specialty.specialtyId} specialty={specialty} index={index} />)}</PublicCatalogCarousel>
    </section>
    <section id="doctors" className="mt-8">
      <h2 className="text-2xl font-bold text-slate-900">Tìm người đồng hành cùng sức khỏe</h2>
      <PublicCatalogCarousel label="bác sĩ" variant="doctors">{doctors.map((doctor) => <DoctorPreviewCard key={doctor.doctorId} doctor={doctor} />)}</PublicCatalogCarousel>
    </section>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><Preview /></BrowserRouter></StrictMode>)
