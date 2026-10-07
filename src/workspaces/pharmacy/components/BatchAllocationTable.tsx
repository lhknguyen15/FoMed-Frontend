import type { PharmacyPrescription } from '../../../features/pharmacy/types/pharmacy'

export default function BatchAllocationTable({ items }: { items: PharmacyPrescription['items'] }) {
  return <div className="overflow-x-auto"><table className="data-table min-w-[760px]"><thead><tr><th>Thuốc</th><th>Còn phải phát</th><th>Lô đề xuất theo hạn dùng</th><th>Hạn dùng</th><th>Tồn lô</th><th>SL dự kiến</th></tr></thead><tbody>{items.flatMap(item => {
    const batches = item.proposedBatches.length ? item.proposedBatches : [null]
    return batches.map((batch, index) => <tr key={`${item.medicineId}-${batch?.batchId ?? 'none'}`}>
      {index === 0 && <><td rowSpan={batches.length}><strong>{item.medicineName}</strong><p className="mt-1 text-xs text-slate-500">Tồn khả dụng: {item.availableQuantity} {item.unit}</p>{item.shortageQuantity > 0 && <p className="mt-1 text-xs font-semibold text-rose-600">Thiếu {item.shortageQuantity} {item.unit}</p>}</td><td rowSpan={batches.length}>{item.remainingQuantity}</td></>}
      <td><strong>{batch?.lotNumber ?? (item.remainingQuantity === 0 ? 'Đã phát đủ' : 'Không có lô phù hợp')}</strong></td><td>{batch ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${batch.expiryDate}T00:00:00`)) : '—'}</td><td>{batch?.availableQuantity ?? '—'}</td><td><strong className="text-teal-700">{batch?.proposedQuantity ?? '—'}</strong></td>
    </tr>)
  })}</tbody></table></div>
}
