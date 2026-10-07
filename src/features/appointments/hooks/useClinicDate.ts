import { useEffect, useState } from 'react'
import { clinicDateInput } from '../utils/patient-appointment-groups'

// Local clock only: do not fetch or change the user's selected date at midnight.
export function useClinicDate() {
  const [date, setDate] = useState(() => clinicDateInput(Date.now()))
  useEffect(() => {
    const update = () => setDate(clinicDateInput(Date.now()))
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return date
}
