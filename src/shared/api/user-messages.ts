// Compatibility until deployed responses provide stable message codes.
// Match known messages only; never add accents to patient-entered content.
const knownMessages = [
  'Không tìm thấy hồ sơ bệnh nhân. Vui lòng cập nhật thông tin cá nhân.',
  'Tài khoản bệnh nhân đang bị khóa hoặc không hoạt động.',
  'Không tìm thấy thông tin bác sĩ.',
  'Không tìm thấy dịch vụ đang hoạt động.',
  'Bác sĩ hiện không hoạt động.',
  'Thời gian đặt lịch không được ở trong quá khứ.',
  'Bác sĩ không có lịch làm việc trong khung giờ này.',
  'Bác sĩ không có lịch làm việc vào ngày này.',
  'Bác sĩ đã đăng ký nghỉ trong thời gian này.',
  'Bác sĩ đã có lịch hẹn khác trong khung giờ này.',
  'Bạn đã có lịch hẹn khác trùng vào khung giờ này.',
  'Không tìm thấy lịch hẹn.',
  'Bạn không có quyền thao tác trên lịch hẹn này.',
  'Trạng thái lịch hẹn không hợp lệ để thực hiện thao tác này.',
  'Lý do hủy lịch là bắt buộc.',
  'Không thể hủy hoặc đổi lịch quá gần giờ khám theo chính sách phòng khám.',
  'Không thể hủy lịch hẹn đang trong quá trình khám.',
  'Chỉ có thể đổi lịch hẹn đang chờ hoặc đã xác nhận.',
  'Đổi lịch khám thành công.',
  'Khung giờ mới không còn phù hợp hoặc đã có lịch khác.',
  'Chỉ có thể hoàn tất lịch hẹn đang trong trạng thái khám.',
  'Cần tạo bệnh án trước khi hoàn tất lịch hẹn.',
  'Cần cập nhật chẩn đoán trước khi hoàn tất lịch hẹn.',
  'Cần hoàn tất hoặc hủy các chỉ định đang chờ trước khi đóng bệnh án.',
  'Chỉ có thể check-in lịch hẹn đã được xác nhận.',
  'Chỉ check-in lịch hẹn trong ngày hẹn.',
  'Lịch hẹn đã được check-in.',
  'Chỉ có thể đánh dấu không đến với lịch hẹn đã xác nhận.',
  'Bệnh nhân đã check-in, không thể đánh dấu không đến.',
  'Chỉ có thể đánh dấu không đến sau giờ bắt đầu lịch hẹn.',
  'Đặt lịch khám thành công.',
  'Xác nhận lịch khám thành công.',
  'Check-in bệnh nhân thành công.',
  'Đã đánh dấu bệnh nhân không đến khám.',
  'Tạo lịch hẹn cho bệnh nhân thành công.',
  'Nguồn đặt lịch tại quầy không hợp lệ.',
  'Lấy hàng chờ khám thành công.',
  'Hiện không có bệnh nhân đang chờ khám.',
  'Gọi bệnh nhân tiếp theo thành công.',
  'Đã chuyển bệnh nhân xuống cuối hàng chờ.',
  'Chỉ có thể thao tác hàng chờ với bệnh nhân đã check-in.',
  'Hoàn thành ca khám thành công.',
  'Hủy lịch khám thành công.',
  'Lấy danh sách khung giờ trống thành công.',
  'Lấy thông tin lịch hẹn thành công.',
  'Lấy danh sách lịch hẹn thành công.',
  'Đã có bệnh nhân đặt.',
  'Không tìm thấy chỉ định.',
  'Không có phí khám, dịch vụ hoặc thuốc để lập hóa đơn.',
  'Trang không hợp lệ.',
  'Không tìm thấy hóa đơn.',
  'Không thể hủy hóa đơn đã phát sinh thanh toán.',
]
const key = (value: string) => value.trim().normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').replace(/\s+/g, ' ').replace(/[.!]+$/, '').toLowerCase()
const translations = new Map(knownMessages.map(message => [key(message), message]))
translations.set(key('Token khong hop le.'), 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
translations.set(key('TÃ i khoáº£n hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.'), 'Tài khoản hoặc số điện thoại đã được sử dụng.')
translations.set(key('CÃ³ nhiá»u há»“ sÆ¡ vÃ£ng lai khÃ´ng thá»ƒ tá»± Ä‘á»™ng liÃªn káº¿t.'), 'Có nhiều hồ sơ vãng lai trùng thông tin. Vui lòng liên hệ lễ tân để kiểm tra hồ sơ.')
const technicalMessage = /\b(?:api|backend|frontend|components?|endpoint|database|sql|sqlclient|exception|stacktrace|transaction|payload|token|localhost|hmac|secret|system\.[\w.]+)\b|\w+_\w+|https?:\/\/|[A-Z]:\\|<[^>]+>|\bat\s+\w+[.\w]*\(/i

export function toUserMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const message = value.trim().normalize('NFC')
  const translated = translations.get(key(message))
  if (translated) return translated.replace(/check-in/gi, 'ghi nhận đến khám')
  // Keep ordinary accented business messages, not internal/English/unknown ASCII errors.
  if (!message || message.length > 600 || technicalMessage.test(message) || /Ã|Â|áº|á»|Ä|Æ|�/.test(message) || !/[À-ỹ]/u.test(message)) return fallback
  return message
}

export function displayError(reason: unknown, fallback = 'Không thể thực hiện yêu cầu. Vui lòng thử lại.'): string {
  return toUserMessage(reason instanceof Error ? reason.message : null, fallback)
}

export function getUserErrorMessage(payload: unknown, status: number): string {
  const fallback = status === 0 ? 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.'
    : status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    : status === 403 ? 'Bạn không có quyền thực hiện thao tác này.'
    : status === 404 ? 'Không tìm thấy thông tin cần xem. Vui lòng tải lại trang.'
    : status === 409 ? 'Thông tin đã thay đổi hoặc bị trùng. Vui lòng tải lại và kiểm tra trước khi tiếp tục.'
    : status === 429 ? 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.'
    : status >= 500 ? 'Hệ thống tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau.'
    : 'Không thể thực hiện yêu cầu. Vui lòng kiểm tra thông tin và thử lại.'
  if (status >= 500 || !payload || typeof payload !== 'object') return fallback
  const { message, errors } = payload as { message?: unknown; errors?: unknown }
  const businessMessage = toUserMessage(message, '')
  if (businessMessage) return businessMessage
  if (errors && typeof errors === 'object') {
    for (const entries of Object.values(errors)) {
      if (!Array.isArray(entries)) continue
      for (const entry of entries) {
        const validation = toUserMessage(entry, '')
        if (validation) return validation
      }
    }
    return 'Một số thông tin chưa hợp lệ. Vui lòng kiểm tra các trường bắt buộc và giá trị đã nhập.'
  }
  return fallback
}
