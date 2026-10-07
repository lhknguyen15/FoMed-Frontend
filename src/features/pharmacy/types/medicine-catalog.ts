export type MedicineStatusFilter = 'all' | 'active' | 'inactive'
export type MedicineCatalogFilters = { keyword: string; status: MedicineStatusFilter }
export type MedicineCatalogRow = {
  id: number; name: string; unit: string | null; price: number; description: string | null
  isActive: boolean; stockQuantity: number; availableQuantity: number; version: string
}
export type MedicineCatalogPage = { items: MedicineCatalogRow[]; page: number; pageSize: number; totalCount: number }
export type SaveMedicineInput = { name: string; unit: string; price: number; description?: string }
