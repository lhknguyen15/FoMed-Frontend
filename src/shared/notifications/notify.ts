import { toast } from 'sonner'
import { displayError, toUserMessage } from '../api/user-messages'

// Call only from operation outcomes, never from rendering or every GET.
// Use business wording, not personal, medical, banking or authentication details.
export const notify = {
  success(message: string, id?: string) {
    return toast.success(toUserMessage(message, 'Thao tác đã hoàn tất.'), { id, duration: 5000 })
  },
  info(message: string, id?: string) {
    return toast.info(toUserMessage(message, 'Vui lòng kiểm tra thông tin trước khi tiếp tục.'), { id, duration: 7000 })
  },
  error(reason: unknown, fallback = 'Không thể thực hiện thao tác. Vui lòng thử lại.', id?: string) {
    return toast.error(displayError(reason, fallback), { id, duration: 8000 })
  },
}
