# FM 01 Danh mục thuốc quản trị

Admin có mục **Danh mục thuốc** tại `/admin/medicines`: tìm theo tên/đơn vị/mô tả,
lọc đang/ngừng sử dụng, phân trang server, thêm/sửa tên, đơn vị, giá bán, mô tả
và ngừng/sử dụng lại sau xác nhận. Không xóa cứng hoặc tự thay đổi tồn kho.

API dùng `/api/admin/medicines`, chỉ cho tài khoản Admin đang hoạt động.
GET trả `items`, `page`, `pageSize`, `totalCount`; mỗi thuốc có `stockQuantity`,
`availableQuantity`, `version`. PUT sửa/đổi trạng thái gửi `expectedVersion` để
chặn ghi đè dữ liệu đã được người khác sửa. Lỗi hiển thị trong hộp thoại, không
thông báo thành công khi ghi thất bại; thành công dùng Sonner.

Ngừng sử dụng bị chặn khi thuốc còn trong đơn của ca đang khám hoặc đơn hoàn tất
chưa cấp phát đủ. Thuốc mới cần nhập lô qua phần kho trước khi cấp phát. Thuốc đã
có lô/chứng từ không được đổi đơn vị để giữ đúng ý nghĩa số lượng. Giá mới không
thay đổi snapshot giá đã lưu. Backend đồng thời sửa tính tiền cho snapshot
thuốc giá 0; cần triển khai cả API và frontend, không cần migration mới ngoài bộ
migrations nghiệp vụ hiện có.

```powershell
node tests/medicine-catalog.audit.cjs
npm run lint
npm run build
```

Bộ kiểm thử dùng fixture cô lập, không gọi HTTP/Azure; chưa thay thế nghiệm thu
trình duyệt trên bản deploy. Sau khi chạy backend/frontend mới, đăng nhập Admin
để kiểm tra mục Danh mục thuốc. Chưa commit/push hoặc deploy thay đổi này.
