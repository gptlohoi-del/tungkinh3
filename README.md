# Tụng Kinh 3 — bản tiết kiệm dung lượng cho App Hub (1.1)

Bản này giữ chức năng **luyện đọc từng câu, ghi âm/so sánh, lặp đoạn A–B và lặp danh sách câu**, nhưng chia giao diện thành ba tab. Có ô **Đến câu số**: nhập số câu (bắt đầu từ 1) rồi nhấn **Đi đến** hoặc Enter; khi REC chưa kết thúc, không cho chuyển câu/chức năng để tránh mất bản ghi. Chức năng vừa chọn được nhớ lại ở lần mở sau.

## 1. Loại bỏ dữ liệu trùng với KinhTest2

Đã so sánh SHA-256 với ZIP KinhTest2 do người dùng cung cấp: **4 tệp giống hệt nhau** (MP3 và SRT bài 01, bài 02), tổng **29.171.339 byte (~27,82 MiB)**. Bốn tệp đó được **loại khỏi repo Tụng Kinh 3**, tránh đóng gói/tải trùng. Riêng MP3 + SRT bài **03 ADDITIONAL PRAYER** và `IPA.txt` của Tụng Kinh 3 được giữ nguyên; hai tệp IPA của hai app không giống nhau.

`tracks.json` chứa **3 bài**, mỗi bài có các cặp nguồn MP3/SRT:

- Bài 01: `../kinhtest2/01 Kinh nh#U1ea1c CH#U00c1NH TINH T#U1ea4N eng.*` (theo tên thực tế xuất hiện trong ZIP KinhTest2); dự phòng tên chuẩn Unicode `01 Kinh nhạc CHÁNH TINH TẤN eng.*` nếu GitHub/App Hub dùng tên ấy.
- Bài 02: `../kinhtest2/02 Kinh doc CHANH TINH TAN eng.*`.
- Bài 03: `./03 ADDITIONAL PRAYER.*` của Tụng Kinh 3.

Ứng dụng thử đọc phụ đề trước và chọn cặp đường dẫn tương ứng; cả tên chứa `#` lẫn tiếng Việt đều được mã hóa đúng khi mở URL. Nếu không tìm được file sẽ báo rõ trên giao diện, **không tự động tải về/nhân đôi dữ liệu từ Internet**.

**Yêu cầu bắt buộc:** Trong gói App Hub, hai thư mục cần nằm **cùng cấp**:

```text
public/modules/
  kinhtest2/
    index.html
    01 Kinh nh#U1ea1c CH#U00c1NH TINH T#U1ea4N eng.mp3
    01 Kinh nh#U1ea1c CH#U00c1NH TINH T#U1ea4N eng.srt
    02 Kinh doc CHANH TINH TAN eng.mp3
    02 Kinh doc CHANH TINH TAN eng.srt
    ...
  tungkinh3/
    index.html
    practice.js / practice.css / tracks.json
    03 ADDITIONAL PRAYER.mp3
    03 ADDITIONAL PRAYER.srt
    IPA.txt
    ...
```

Nếu KinhTest2 đang dùng tên Unicode thay cho dạng `#U...`, mã cũng có đường dẫn dự phòng. Không đổi tên tệp trong KinhTest2 nếu chưa cập nhật `tracks.json`.

**Lưu ý về offline:** Khi App Hub đóng gói cả hai thư mục và phát tài nguyên từ cùng server nội bộ/WebView, đường dẫn `../kinhtest2/` hoạt động hoàn toàn cục bộ. Không cần mạng khi nghe, nếu mọi tài nguyên đã được đóng gói đầy đủ. Nhưng chỉ đổi **topic** GitHub không bảo đảm App Hub đã lấy repo, và **không có gì bảo đảm hai repo chạy độc lập offline trong Chrome**: service worker của Tụng Kinh 3 không thể tự chặn URL nằm ngoài scope của nó. Khi chạy riêng trên GitHub Pages, KinhTest2 phải được host cùng origin tại đường dẫn `../kinhtest2/`; nếu không, bài 01 và 02 sẽ không có nguồn phát. Để dùng offline độc lập, cần chủ động cung cấp đường dẫn tới bản tệp đã tải cục bộ (sẽ làm tăng dung lượng).

### Đưa vào App Hub

1. Đưa **toàn bộ nội dung** của ZIP này vào gốc repo `tungkinh3`, có `index.html`, `tracks.json`, `apphub.json`, `practice.js`, `practice.css`, `sw.js`, `IPA.txt`, hai tệp bài 03. **Không thêm lại** bốn tệp bị trùng.
2. Trong **About → Topics** của repo trên GitHub, thêm `app-hub-module` nếu bản App Hub của bạn phát hiện repo theo topic.
3. Bản App Hub cần thu thập `kinhtest2` **và** `tungkinh3` vào `public/modules/` theo cấu trúc trên. Nếu bộ thu thập đổi tên/cấp thư mục, cần sửa nó hoặc sửa `tracks.json`; chỉ có hai ZIP module **chưa đủ để sửa chính xác** script của App Hub.
4. Chạy lệnh kiểm tra đường dẫn trong thư mục gốc của App Hub **sau bước collect**: `python3 public/modules/tungkinh3/tests/verify_apphub_shared.py public/modules`. Nếu bộ thu thập không sao chép thư mục `tests/`, hãy chạy script ở repo Tụng Kinh 3 bằng đường dẫn tương ứng hoặc xác minh thủ công.
5. Chạy **Publish Offline Web OTA**, áp dụng bản cập nhật và **đóng/mở App Hub** nếu trình cập nhật yêu cầu. Thử mở cả ba bài rồi bật chế độ máy bay để kiểm tra offline.

**Không nhất thiết phải cài APK mới** nếu App Hub hiện tại đã có khả năng thu thập module mới và tải gói OTA, và không cần thêm quyền/plugin native. Điều này cần được xác nhận với mã App Hub đang dùng.

## 2. Hướng dẫn ba chức năng

**Tab 🎙 Luyện từng câu:** Hai nút Câu trước/Câu tiếp, ô nhập số câu, nghe mẫu, REC, so sánh giọng, nghe lại giọng mình, tải bản ghi. Chọn câu qua số 1…N (tổng số câu hiện ở trên). Không cho chuyển khi đang ghi âm.

**Tab 🔁 Lặp đoạn A–B:** Mở bài, tua đến mốc A, nhấn nút A–B, tua đến mốc B và nhấn lần nữa để lặp đoạn. Nhấn lại để tắt.

**Tab 📑 Lặp danh sách:** Tích các câu muốn lặp, nhấn bắt đầu. Có nút hoa sen để chọn hàng loạt theo số/khoảng (VD `5-10,13,20-25` hay `*`). Chuyển tab sẽ dừng các vòng lặp hiện tại, tránh phát chồng âm thanh; những câu đã tích có thể chọn lại khi quay về.

## 3. Ghi âm và lưu bản thu

Trong nút hoa sen → **Setting**:

- Tùy chỉnh cỡ chữ, khoảng nghỉ khi nghe lại giọng mình (mặc định 2 giây), khoảng nghỉ giữa mẫu và bản ghi (1,5 giây), lặp vô hạn hoặc 5/10 lần, đệm MP3 (0,1 giây), bật/tắt tự phát bản ghi.
- Lưu bản gần nhất mỗi câu (mặc định), lưu nhiều bản hoặc không lưu. Dữ liệu lưu ở **IndexedDB** thuộc thiết bị, không tự tải lên server. Có thể chọn thư mục nếu trình duyệt hỗ trợ, tải bản ghi hoặc xuất tất cả thành ZIP.
- Cần quyền microphone và HTTPS (hoặc localhost). Chrome Android có thể giới hạn tự phát âm thanh và API ghi file. Dữ liệu IndexedDB có thể bị mất khi xóa dữ liệu app hoặc gỡ ứng dụng, nên **xuất ZIP dự phòng định kỳ**.

## 4. Kiểm thử trước khi sử dụng

- [ ] Mở cả ba bài; bài 01 và 02 phát âm thanh + hiện SRT lấy từ **kinhtest2**; bài 03 lấy dữ liệu nội bộ.
- [ ] Ngắt Internet trong App Hub, khởi động lại App Hub, phát và tua ngẫu nhiên bài 01, 02, 03.
- [ ] Chọn lần lượt cả ba tab, xác nhận mỗi lần chỉ **một khung chức năng** xuất hiện, chuyển tab ngắt lặp/phát cũ.
- [ ] Nhập câu đầu, cuối, câu giữa rồi nhấn Enter/Đi đến; nhập 0, số quá giới hạn, chữ và kiểm tra thông báo.
- [ ] Đang REC không thể đổi câu hoặc tab; kết thúc REC, nghe tự lặp và so sánh mẫu/giọng mình.
- [ ] Lặp AB đúng hai mốc; chọn nhiều câu không liền nhau, lặp nhiều lần; đổi bài/tab thì dừng lặp.
- [ ] Ghi âm, lưu nhiều bản, tải và xuất ZIP; khởi động lại vẫn có lịch sử (khi chế độ cho phép).
- [ ] Kiểm tra SHA-256 và xác minh không có MP3/SRT bài 01 và 02 trong `tungkinh3` sau build.

**Các tệp đã thay đổi:** `index.html`, `practice.js`, `practice.css`, `tracks.json`, `sw.js`, `README.md`, `tests/smoke.py`. Tệp mới: `apphub.json`, `tests/verify_apphub_shared.py`.
