# Kiểm thử ô tiền thu ngân — 05/10/2026

## Cập nhật đã triển khai — thu đủ và trả tiền thừa

Theo quyết định sản phẩm mới, frontend không tạo khoản thu một phần. Backend và các kiểm thử HTTP thu một phần được giữ nguyên để phát triển sau.

- Dùng đúng scaffold `features/billing/components/PaymentForm.tsx` và `schemas/payment-schema.ts`, không tạo thêm module/dependency.
- Tiền mặt nhập **Tiền khách đưa** bằng ô text/bàn phím số. Nhận chữ số, dấu chấm hoặc khoảng trắng phân nhóm hàng nghìn đúng cấu trúc; format khi rời ô để không làm nhảy caret lúc sửa. `500000`/`500.000` đều là 500 nghìn. Chuỗi có dấu phẩy, dấu nhóm sai, số mũ/thập phân/âm bị báo lỗi, không tự xóa ký tự rồi đoán tiền. Giới hạn tiền khách đưa 10 tỷ đồng, đủ phủ mức tối đa hóa đơn trong DTO.
- Hiển thị **Thanh toán hóa đơn** theo số dư và **Tiền thừa cần trả**. Nhập thiếu khóa xác nhận, không gửi API; không có nút Thu toàn bộ. Các hình thức khác xác nhận đủ số dư, không nhập tiền khách đưa hoặc tính tiền thối.
- POST gửi `amount` bằng số dư, phương thức, ghi chú, UUID chống ghi nhận lặp và `cashReceived` riêng cho tiền mặt; không gửi người thu hoặc tiền thừa tự tính. Hóa đơn 350.000 đ/khách đưa 500.000 đ chỉ tạo khoản thanh toán 350.000 đ, tiền thừa 150.000 đ. Hóa đơn cũ đã thu 150.000 đ thì chỉ thu thêm 200.000 đ, trả lại 300.000 đ nếu khách đưa 500.000 đ.
- Khóa cả form trong khi gửi, chống gửi lặp, lỗi giữ tiền khách đưa và tải lại trạng thái/số dư trước thao tác tiếp. Sau thành công hiển thị lại tiền khách đưa/đã thanh toán/tiền thừa để lễ tân đối chiếu.
- Không tự làm tròn số dư có phần lẻ từ API; chuẩn hóa phép trừ theo hai chữ số thập phân để không gửi đuôi sai số JavaScript. Tiền khách đưa vẫn là VND nguyên, phần thừa có thể có số lẻ nếu dữ liệu hóa đơn cũ như vậy; cần thống nhất chính sách làm tròn dữ liệu riêng trước vận hành tiền mặt với dữ liệu đó.
- Backend đã lưu tiền khách đưa, người thu xác thực và snapshot tên theo từng payment, tự tính `changeAmount`. `PaymentHistory.tsx` hiển thị dữ liệu API ở thu ngân và modal hóa đơn bệnh nhân, phục hồi sau reload. Giao dịch cũ giữ NULL/chưa ghi nhận, không giả định tiền khách đưa bằng số tiền thu. Không coi tiền thừa là nghiệp vụ hoàn tiền.
- Backend chống ghi nhận lặp theo người thu + `idempotencyKey`: cùng payload trả giao dịch đã có, khác payload trả 409. FE giữ key khi retry payload không đổi trong lượt đang mở; sửa payload tạo key mới. Nếu mất phản hồi nhưng GET đối soát tìm thấy giao dịch khớp, hiển thị đã ghi nhận và không thu lại. Không có queue tự retry hoặc lưu key bền qua đóng tab/reload.

Trước chạy API mới, cần execute `database/migrations/20261005_add_payment_cash_audit.sql` trên đúng FoMedDb rồi restart API. Không tự áp dụng migration lên database ứng dụng. Hợp đồng và giới hạn nằm tại `docs/payment-cash-audit.md` ở repository cha.

`cashier-money-input.audit.cjs` đã chuyển từ chẩn đoán lỗi cũ sang regression hành vi mới: API vẫn được intercept, thêm mock thành công/khóa form/lỗi mạng/reconciliation, số dư cũ, decimal, thẻ/chuyển khoản/ví. Luồng `clinic-workflow.e2e.cjs` dùng API thật của database tạm nay khách đưa 500, thanh toán 420, thối 80; đối chiếu đúng một khoản thu, doanh thu 420, không phải 500.

### Regression sau bổ sung lưu giao dịch tiền mặt

Lượt cuối đạt **546 assertions / 130 trường hợp**: 104 ca nhập liệu và 26 ca workflow/form/retry key/reload/dữ liệu cũ/decimal/layout, en-US/1440px và vi-VN/390px. Bộ này mock toàn bộ API, không forward sang backend. Mất phản hồi giả lập kiểm tra FE đối soát theo GET, không dùng để khẳng định idempotency server. Kết quả API thật được ghi riêng trong báo cáo workflow.

Lượt full mới nhất với API thật/database tạm: **329 UI (178 smoke + 151 E2E), runner 295/0 (271 kiểm tra HTTP/SQL gồm 45 cash audit + 24 browser/database), SQL regression 51 và time/slot 7**. Hai lượt UI có đúng một payment 420, tender 500 và change 80, collector/key đã lưu; reload hiển thị được lịch sử. Ca desktop mất phản hồi sau API commit đã đối soát đúng, không thu lại. API thu một phần/legacy/noncash, quyền truy cập và concurrent replay vẫn đạt. Các lượt trung gian lỗi điểm chờ/selector của test không được gộp thành kết quả đạt; đã sửa rồi chạy lại toàn bộ.

Build API/runner, TypeScript, lint và Vite đạt; cảnh báo dependency XML/backend và bundle lớn vẫn còn, không thuộc thay đổi này. Đã kiểm tra ảnh mobile/desktop; không có tràn ngang document, JS error hoặc API 5xx trong luồng UI bình thường được chạy. DB/kho file/API/preview tạm đã dọn. Chưa chạy migration lên FoMedDb, không commit/push.

### Kết quả lịch sử — lượt thuần UI trước khi lưu metadata payment

- Regression tiền thừa: **500 assertions đạt trên 128 trường hợp** — 104 ca nhập liệu (26 chuỗi × 2 cách nhập × 2 context) và 24 ca workflow/form/legacy/layout. Chromium 153.0.8010.12, en-US/1440px và vi-VN/390px. API ở bộ này là mock, không phải thanh toán thật.
- Full workflow với API thật trên DB tạm: **322 UI đạt (178 smoke + 144 E2E), runner 248 đạt/0 lỗi (226 HTTP + 22 browser/database), time/slot 7 đạt**. Hai bệnh nhân có đúng một khoản thu 420 mỗi người; báo cáo payments không tính 500 tiền khách đưa hoặc 80 tiền thừa. HTTP regression thu một phần vẫn đạt, không bỏ chức năng API này.
- TypeScript, lint, Vite build và build test runner đạt. Cảnh báo bundle lớn và dependency backend `System.Security.Cryptography.Xml` 9.0.0 có sẵn chưa xử lý trong phạm vi này.
- Các lượt trung gian bị ngắt vì nhãn form/chờ request kiểm thử đã được sửa; chỉ số trên chỉ lấy lượt cuối, không ghép các ca chưa chạy. Không có JS error/API 5xx trong UI bình thường hoặc tràn ngang document ở những viewport đã kiểm tra.
- DB/kho file tạm và API/preview thuộc kiểm thử đã dọn. Không thay đổi dữ liệu FoMedDb, không commit/push. Không khẳng định đã kiểm thử Safari/Firefox/bàn phím mobile thật, tiền thừa thực tế hoặc idempotency phía backend.

Các phần bên dưới giữ lại **kết quả chẩn đoán trước chỉnh sửa**, không mô tả hành vi UI mới.

## Phạm vi và an toàn

Chạy `tests/cashier-money-input.audit.cjs` trên trang React hiện tại `/reception/cashier/900001`, được phục vụ trực tiếp từ source bằng Vite ở cổng 5186. Chromium 153.0.8010.12, hai context: en-US/1440px và vi-VN/390px. Mỗi context thử gõ từng ký tự và chèn cả chuỗi bằng Playwright `keyboard.insertText`: 17 chuỗi × 2 cách × 2 context = **68 ca hoàn tất**.

Session và hóa đơn 350.000 đ là dữ liệu giả của bài test. Mọi endpoint `/api/` được intercept; GET trả fixture, POST chỉ ghi lại JSON rồi trả lỗi chẩn đoán, không forward sang API, không giả thanh toán thành công. Không thay đổi DB ứng dụng, không chạy SQL, không sửa UI sản phẩm, không commit/push. Vite sở hữu bởi lượt test đã dừng.

Đây là kiểm thử nhập liệu/payload frontend, **không phải 68 ca thanh toán thật đạt**. Không dùng clipboard Windows thật, không mô phỏng bàn phím/IME của điện thoại thật, chưa chạy Firefox/Safari/Edge hoặc mọi thiết lập hệ điều hành. Viewport 390px không tương đương thiết bị mobile thật.

## Kết quả quan sát

Các kết quả dưới đây nhất quán ở bốn tổ hợp được chạy. Payload là giá trị đã bắt tại request, không phải khoản thu ghi vào database.

| Chuỗi đưa vào ô | Giá trị DOM | `amount` gửi đi | Nhận xét |
| --- | --- | --- | --- |
| `150000` | `150000` | 150000 | Đúng số tiền 150 nghìn |
| `150.000` | `150.000` | 150 | Lỗi hiểu dấu chấm là thập phân, không chặn |
| `150,000` | `150000` | 150000 | Chromium bỏ dấu phẩy; không phải parser tiền tệ của FE |
| `150 000` | `150000` | 150000 | Chromium bỏ khoảng trắng; NBSP/narrow NBSP cũng tương tự |
| `150.000,00` | `150.00000` | 150 | Vẫn sai nếu người dùng định nhập 150 nghìn |
| `150,000.00` | `150000.00` | 150000 | Không bảo đảm các browser khác xử lý tương tự |
| `150,5` | `1505` | 1505 | Ký tự bị bỏ làm thay đổi ý nghĩa số tiền |
| `350000` | `350000` | 350000 | FE cho gửi đúng tổng hóa đơn giả |
| `350001` | `350001` | Không gửi | FE chặn vượt số dư |
| `0`, `-150000`, rỗng | Tương ứng | Không gửi | FE chặn không dương/rỗng |
| `1e5` | `1e5` | 100000 | Đang cho phép dạng số mũ |
| `0.1` | `0.1` | 0.1 | Đang cho phép phần lẻ của đồng |
| `0.001` | `0.001` | 0.001 | Native validity false nhưng handler vẫn gửi |

Không tái hiện được việc chuỗi không dấu **`150000` → 150**. Đã tái hiện rõ **`150.000` → 150**, có thể giải thích hiện tượng trước đây nếu số được nhập kèm dấu chấm; chưa đủ bằng chứng để khẳng định chính xác thao tác trên phiên bản cũ.

## Nguyên nhân đối chiếu source

- `ReceptionCashierPage.tsx` dùng `type="number"`, `step="0.01"` và `Number(amount)`. Dấu chấm được hiểu là thập phân. Ô có thể hiển thị 150.000 trong khi giá trị số là 150; native validity vẫn true.
- Adapter `invoiceApi.pay` gửi nguyên số đó trong JSON, không chia 1.000.
- `min`/`max`/`step` không thay thế kiểm tra ở handler: nút gọi `pay()` trực tiếp, không có submit form chạy native validation. Vì guard chỉ kiểm tra finite, dương và không vượt số dư, 0.001 vẫn ra request dù invalid theo min/step.
- Đối chiếu code API: DTO nhận decimal từ 0.01; service chỉ nhận tối đa hai chữ số thập phân và không vượt số dư. API sẽ không biết người dùng đã nhập `150.000` với ý nghĩa 150 nghìn khi payload chỉ còn 150. Chưa gọi backend cho những ca chẩn đoán này.

## Đề xuất ban đầu — đã được thay thế bởi quyết định thu đủ ở trên

1. Dùng component ô tiền chung tại scaffold shared hiện có, `type="text"`, `inputMode="numeric"`, đơn vị VND cố định. Tách giá trị chuẩn để gửi API khỏi chuỗi hiển thị; nhập `150000` → hiển thị `150.000` → JSON `amount: 150000`, không chia/nhân đơn vị.
2. Với chính sách thu **đồng nguyên**, chỉ nhận chữ số không dấu hoặc chuỗi phân nhóm hàng nghìn hợp lệ bằng dấu chấm/khoảng trắng. Kiểm tra cấu trúc toàn bộ chuỗi trước khi bỏ dấu nhóm. Không dùng cách xóa mọi ký tự không phải số: `150,5` không được biến thành 1505. Chuỗi có dấu phẩy/thập phân lẫn định dạng mơ hồ cần báo lỗi, không tự đoán. Nếu cần nhận định dạng nước ngoài phải bổ sung quy tắc minh bạch và ca test riêng.
3. Chặn rỗng, âm, dạng mũ, vượt giới hạn số an toàn/giới hạn DTO và vượt số dư. Không tự làm tròn, cắt số hoặc ép về số dư khi người dùng nhập sai. Giữ giá trị để người dùng sửa, thông báo ngay dưới ô.
4. Hiện dòng đối chiếu trước gửi: **Thu lần này 150.000 đ · Còn lại sau thu 200.000 đ**; thêm nút **Thu toàn bộ số còn lại**. Không cần thêm modal cho mọi lần thu nếu dòng xác nhận/ngữ cảnh đã rõ.
5. Khi request đang chạy, khóa cả số tiền/phương thức/ghi chú và nút xác nhận; khi lỗi giữ form. Giữ kiểm tra API là lớp bảo vệ cuối cùng. Chống thu trùng khi mất response vẫn cần API idempotency/đối soát, không được coi là đã giải quyết bởi component này.
6. Thêm ca regression cho nhập/xóa/chèn giữa chuỗi, caret, chèn/dán nội dung, dấu nhóm sai (`15.00`, `1.50.000`), số thập phân, hết nợ/thu một phần, số tiền hàng triệu và bàn phím mobile thật khi nghiệm thu.

**Chính sách cần thống nhất:** API hiện hỗ trợ decimal hai chữ số và UI hiện cho thu phần lẻ. Nếu chọn VND nguyên, cần kiểm tra dữ liệu đơn giá/tổng hóa đơn hiện có và thống nhất API/danh mục; không chỉ khóa FE rồi khiến hóa đơn có số lẻ không thu hết được. Không tự đổi chính sách hoặc làm tròn dữ liệu trong lần kiểm thử này.

## Chạy lại

Trong FoMed-Frontend, chạy Vite source ở terminal riêng:

```powershell
npx.cmd vite --configLoader runner --host 127.0.0.1 --port 5186 --strictPort
```

Sau đó, với Playwright/Chromium đã có sẵn (đặt `PLAYWRIGHT_MODULE` đến package cache nếu cần):

```powershell
node tests/cashier-money-input.audit.cjs
```

JSON và ảnh minh chứng tại `dist/money-input-audit/`, ignored. Script hiện kiểm tra hành vi mới theo phần cập nhật ở đầu tài liệu; kết quả 68 ca phía trên là lịch sử chẩn đoán lỗi cũ. Không chạy script vào API/database ứng dụng.
