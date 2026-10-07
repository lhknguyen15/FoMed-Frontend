# Kiểm thử workflow liên vai trò

## Cập nhật mới — lưu giao dịch tiền mặt và đối soát

Đã bổ sung backend lưu `cashReceived`, người thu từ tài khoản xác thực và snapshot tên, server tính `changeAmount`. Lịch sử thu ngân/hóa đơn bệnh nhân lấy từ API và phục hồi sau reload, dữ liệu cũ hiển thị chưa ghi nhận. UUID theo người thu chống ghi nhận lặp; cùng payload replay, khác payload trả 409. FE giữ key cho retry trong lượt đang mở, kiểm tra GET sau lỗi trước thao tác tiếp. API thu một phần vẫn được giữ nguyên.

Cần execute `database/migrations/20261005_add_payment_cash_audit.sql` trên đúng FoMedDb **trước** khi chạy API mới. Chưa áp dụng lên database ứng dụng. Chi tiết hợp đồng/triển khai/giới hạn tại `docs/payment-cash-audit.md` ở repository API.

Regression FE mới nhất: **546 assertions / 130 trường hợp**, mock toàn bộ API ở desktop/mobile, không phải giao dịch thực. Workflow thật lượt cuối đạt **329 UI (178 smoke + 151 E2E), runner 295/0 (271 HTTP/SQL, gồm 45 cash audit, + 24 browser/database), SQL 51 và time/slot 7**. Desktop có ca mất response sau API commit, GET đối soát đúng một payment; cả desktop/mobile phục hồi tiền thừa/người thu sau reload và doanh thu vẫn theo amount, không theo tender. Build API/runner, TypeScript/lint/Vite đạt. Các lượt trung gian lỗi điểm chờ/selector của test đã sửa và chạy lại toàn bộ, không gộp vào kết quả đạt. DB/kho file/API/preview tạm đã dọn; không chạy migration lên FoMedDb, không commit/push. Các kết quả và nhận xét ‘chưa lưu metadata/chưa có idempotency’ bên dưới là lịch sử trước bổ sung này.


Đợt 05/10/2026 dùng FoMed-API thật và workflow VC của review-erd-net06, không dùng FoMed-FE.

Báo cáo đầy đủ và backlog liên FE/API nằm trong repository cha tại `docs/clinic-workflow-audit-20261005.md`. Không coi việc tải trang thành công là đã hoàn thiện mọi chức năng.

## Cập nhật thu ngân — thu đủ và trả tiền thừa

UI hiện không tạo thanh toán một phần: tiền mặt nhập Tiền khách đưa, xác nhận khi đủ/dư, POST đúng số dư và hiển thị tiền thừa trả khách. Các phương thức khác xác nhận đủ số dư, không tính tiền thừa. Backend thu một phần vẫn giữ nguyên; dữ liệu hóa đơn cũ dùng đúng số dư còn lại. Đã dùng `features/billing/components/PaymentForm.tsx` và `schemas/payment-schema.ts` trong scaffold, không thêm module/dependency.

Regression riêng đạt **500 assertions/128 trường hợp** với API giả bị chặn hoàn toàn, ở en-US/1440px và vi-VN/390px: định dạng tiền, khóa nhập thiếu, đủ/dư, khóa form khi gửi, retry/refresh, dữ liệu cũ, decimal, phương thức không tiền mặt và layout. Không coi các mock response này là kiểm thử thanh toán thật hoặc bảo đảm idempotency server. Chi tiết tại `docs/MONEY-INPUT-AUDIT.md`.

Luồng E2E thật đã được cập nhật từ hai lần thu 200 + 220 sang nhận tiền mặt 500, ghi một khoản thu 420, thối 80 và đối chiếu báo cáo/patient invoice/SQL. Lượt full cuối đạt **322 UI (178 smoke + 144 E2E), runner 248/0 (226 HTTP + 22 browser/database), time/slot 7**. HTTP thu một phần vẫn đạt; không sửa hành vi API đó. Lint/TypeScript/Vite và build runner đạt; DB/kho file/API/preview kiểm thử đã dọn, không ghi giao dịch lên FoMedDb, chưa commit/push. Tiền khách đưa/tiền thừa chỉ đối chiếu UI, chưa lưu riêng trong API.

## Mục 5 — Kết quả trước quyết định thu đủ

Đã chạy hai lượt khám hoàn toàn qua UI với FoMed-API thật trên database tạm, ở 1440px và 390px: bệnh nhân đặt lịch → lễ tân xác nhận/check-in → bác sĩ khám/chỉ định/kê đơn → kỹ thuật viên trả kết quả → bác sĩ chốt → lễ tân lập hóa đơn/thu hai lần → dược sĩ cấp phát FEFO → bệnh nhân xem bệnh án/tải file → admin đối chiếu doanh thu/công nợ/nhật ký. Fixture không seed các giao dịch khám hoặc thanh toán của hai bệnh nhân này.

Các điểm đứt đã sửa tại scaffold hiện có:

- Thu ngân có nhóm Chờ lập hóa đơn/Hóa đơn đã lập và modal xác nhận lập hóa đơn qua API; chuyển đến chi tiết khi thành công, giữ modal khi lỗi.
- Ngày tái khám rỗng gửi `null` đúng DTO; thao tác lưu/chốt, đặt lịch, check-in, trả kết quả, thu tiền có guard khi đang gửi/tải hoặc dữ liệu không hợp lệ.
- Số lượng chỉ định đúng giới hạn 1–1000; báo cáo tải lại khi lọc cùng điều kiện sau thu tiền; bệnh án hiển thị dịch vụ hủy đúng trạng thái.

Lượt full mới nhất: **320 UI đạt (178 smoke + 142 E2E), runner 248/0 (226 HTTP + 22 kiểm tra browser/database), SQL 51 và time/slot 7 đạt**. Regression auth, lint/TypeScript/Vite và build API đạt. Không có JS error/API 5xx trong UI bình thường hoặc tràn ngang document tại các màn hình được kiểm tra. API/preview và DB/kho file kiểm thử đã dọn; không ghi giao dịch lên DB ứng dụng, chưa commit/push.

Chi tiết, cách chạy và giới hạn nằm tại repo cha `docs/clinical-workflow-item5.md`. Đặc biệt, chưa có idempotency key cho thanh toán; chưa kiểm thử server commit khoản thu rồi mất response. Chặn gửi trùng phía UI không thay thế cơ chế chống thu trùng/đối soát phía API. Các mục bên dưới là lịch sử triển khai, không phải kết quả mới nhất.

## Frontend cần ưu tiên

Mục 4 đã triển khai trên các folder scaffold hiện có, không tạo `modules`:

- `/pharmacy/dispense`: chọn đơn thật, tìm kiếm/trạng thái, 10 đơn/trang từ API. Trang chi tiết có bảng lô FEFO/tồn/số lượng dự kiến/thiếu trước xác nhận; thiếu tồn khóa phát, tải lại tồn và POST vẫn kiểm tra server.
- `/technician/results`: lịch sử kết quả của tài khoản kỹ thuật viên từ server, tìm kiếm/10 kết quả mỗi trang, phục hồi sau reload/đăng nhập mới. File kết quả mở panel có quyền theo chỉ định, không xem toàn bộ bệnh án.
- Bác sĩ/technician/bệnh nhân dùng chung `features/clinical/components/AttachmentPanel.tsx`, upload multipart, tải binary có xác thực, loading/error/retry/success và file 10/trang. Modal bệnh nhân vẫn giữ 3 bảng; bệnh nhân chỉ tải, bác sĩ đã chốt không được upload, kỹ thuật viên chỉ append vào kết quả của mình.

Lượt full sau mục 4: **178 UI + 226 HTTP đạt**, runner 229/0, SQL 51/time-slot 7 và regression auth đạt. Đã kiểm thử upload lỗi giữ file, upload/download thật và tên tiếng Việt, orderId khác ID kết quả, trả kết quả + lịch sử server, phân trang/chọn đơn/FEFO/phát thuốc; 23 route ở 1440/390px không có page error/API 5xx/tràn ngang document. Không phải full UI click-through toàn bộ phòng khám. Cần migration `database/migrations/20261005_add_attachment_metadata.sql` trong repo cha, sau đó restart API; **chưa chạy lên DB ứng dụng**, chưa commit/push. Chi tiết quyền/kho file/giới hạn trong repo cha `docs/clinical-workflow-item4.md`; notification báo thiếu, PDF và các backlog khác chưa xử lý.

Các kết quả mục 1–4 là lịch sử triển khai; trạng thái mới ở phần mục 5 phía trên có ưu tiên.

Mục 3 đã triển khai: `/admin/audit-logs` mặc định `MedicalRecord/Read`, có bộ lọc tạo/cập nhật/chốt và người thực hiện/ngày UTC+07, phân trang server 10 bản ghi. Table dùng lại scaffold `features/audit/components/AuditLogTable.tsx`; modal chi tiết chỉ metadata, không mở bệnh án hoặc raw snapshot. Danh tính/vai trò trong log mới được giữ theo thời điểm thao tác; log legacy có thông báo giới hạn. Không tạo thêm module hoặc dependency. Hợp đồng/giới hạn nằm tại repo cha `docs/medical-record-audit.md`; cần restart API, không cần SQL migration.

Lượt full sau mục 3: **152 assertions UI và 164 HTTP đạt**, runner 167/0; SQL 51, lint/TypeScript/Vite đạt. Đã kiểm thử lọc khi submit, phân trang, modal mobile/desktop, Escape/trả focus, ngày cuối kỳ, legacy và retry khi lỗi mạng. Không bỏ ca audit ghi. Kết quả/ảnh trong `dist/review-clinic/` được ignored; chưa commit/push.

Mục 2 đã triển khai: tìm thuốc từ server theo tên và trang 20 kết quả, hiển thị tồn lô còn hạn, chặn chọn thuốc hết tồn/thêm trùng/vượt tồn; dị ứng ở trang khám/kê đơn lấy từ context API theo quyền bác sĩ phụ trách và giữ được khi reload/deep link. Lỗi tải context khóa lưu và có nút thử lại; 409 do tồn thay đổi giữ form đang nhập và cập nhật tồn. API POST/PUT cũng kiểm tra tồn trong transaction; chưa có reservation và chưa tự đối chiếu hoạt chất.

Lượt lịch sử sau mục 2 `--prescribing-only --browser`: **119 assertions HTTP và 138 assertions UI đạt** (runner tổng 122/0 gồm 3 kiểm tra UI/database), SQL 51 checks và regression auth đạt. Khi đó flag bỏ assertion audit ghi chưa triển khai; hiện full suite đã kiểm tra audit ghi, không dùng flag này để bỏ ca. Chi tiết mục 2 và giới hạn tại repo cha `docs/prescription-search-stock-allergies.md`.

Mục 1 đã triển khai: trang phát thuốc tra cứu đơn/trạng thái trước xác nhận; API từ chối bệnh án chưa chốt; đơn đã phát khóa chỉnh sửa ở UI bác sĩ. Hợp đồng mới là `GET /api/pharmacy/prescriptions/{id}` và `isDispensed` trong đơn thuốc clinical. Cần khởi động lại API bằng source mới. Preview lô/tồn đầy đủ vẫn ở backlog riêng.

Kiểm thử sau triển khai với `--dispensing-only --browser`: 120 assertions UI đạt, bao gồm xác nhận cấp phát bằng UI gọi API thật và khóa nút sau thành công; 93 assertions HTTP của luồng liên vai trò/nhánh cấp phát đạt. Flag này bỏ các assertion ngoài mục 1 đã biết chưa đạt (dị ứng deep link, kê thuốc hết tồn, audit sửa); không coi các lỗi đó là đã được sửa.

1. Trang đơn thuốc: tìm thuốc/tồn khả dụng và dị ứng từ server đã xử lý trong mục 2; chưa đối chiếu hoạt chất tự động.
2. Trang phát thuốc: mục 4 đã có danh sách chọn đơn/preview lô/tồn dự kiến; chưa có API báo thiếu gửi bác sĩ.
3. UI đơn đã phát: đã chuyển sang chỉ đọc và hiển thị lý do, API bảo vệ cả dữ liệu legacy.
4. Attachment và lịch sử kỹ thuật viên đã nối API ở mục 4; cần migration trước sử dụng. PDF và báo thiếu vẫn ở backlog, không có nút thành công giả.

## Browser smoke

`tests/clinic-workflow.smoke.cjs` chỉ chạy thông qua fixture `tests/ClinicWorkflow` của repo API với `--http --browser`. Fixture tạo tài khoản/dữ liệu trong database tạm, truyền ID qua môi trường và xóa database khi xong.

Không chạy test này trực tiếp vào database ứng dụng. Playwright được dùng từ package có sẵn bên ngoài repo qua `PLAYWRIGHT_MODULE`; chưa thêm dependency/lockfile mới vào dự án.

Lượt audit ban đầu trước mục 2: 111 assertions đạt, 1 không đạt do cảnh báo dị ứng không phục hồi khi mở URL trực tiếp. Lượt hiện tại đã vượt qua kiểm tra này; 138 assertions UI đạt, không có màn hình trắng/lỗi JavaScript/API 5xx/tràn ngang toàn trang trong 44 lần tải trang. Kết quả này không có nghĩa workflow đã hoàn chỉnh.

Ảnh và kết quả trong `dist/review-clinic/` được gitignore. Lượt mục 4 kiểm tra đăng nhập 6 vai trò, 23 route ở 1440px/390px, role guard bệnh nhân, modal 3 bảng + file, phân trang/hành động dược sĩ và kỹ thuật viên, nút chỉ định sau chốt, lỗi JavaScript/API 5xx và tràn ngang toàn trang. Chưa có full browser click-through cho tất cả nghiệp vụ.
