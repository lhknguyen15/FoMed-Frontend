import { useRecordServiceOrders } from '../hooks/useRecordServiceOrders'
import ServiceOrderResults from './ServiceOrderResults'

export default function RecordServiceResultsPanel({ recordId }: { recordId: number }) {
  const orders = useRecordServiceOrders(recordId)
  return <ServiceOrderResults orders={orders.data} loading={orders.loading} error={orders.error} updatedAt={orders.updatedAt} onRefresh={orders.refresh} />
}
