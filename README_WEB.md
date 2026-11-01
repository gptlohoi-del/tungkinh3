# Tụng Kinh 3 — Phiên bản web OTA 1.2.0

Ứng dụng luyện nghe và luyện đọc từng câu, lặp đoạn A–B, lặp danh sách câu. Đây là **module web** của App Hub, không có mã Android native. Bản 1.2.0 cải tiến đồng loạt **không thêm chế độ luyện đọc tự động**.

## 1. Những gì đã nâng cấp

- **Bộ đếm câu nhỏ `4/10`** ở góc trên phải khung phụ đề chính, cho biết số thứ tự câu trong **toàn bài**; tự thay đổi khi nghe MP3, lặp A–B, lặp danh sách hoặc chọn câu để luyện. Không hiện khi không có câu thực sự đang hiển thị.
- **Nhớ bài đang học, số câu vừa thao tác, tốc độ phát**. Mở lại ứng dụng sẽ chọn bài/câu gần nhất; không tự phát âm thanh khi khởi động. Dữ liệu theo từng bài trong localStorage.
- **Yêu thích (☆) và câu khó (⚑)**: nhấn dấu ở khung luyện câu hoặc ở mỗi dòng danh sách; lọc danh sách và có nút **Chọn ☆ / Chọn ⚑** để chọn nhanh những câu đó làm danh sách lặp.
- **Tiến độ “Đã mở x/y câu”** và số câu đã đánh dấu. Đây là số câu từng nghe/chọn trong thiết bị, **không phải** chấm điểm phát âm hay xác nhận đã thuộc.
- **Nút “Mẫu 0.75×”** trong khung luyện câu, phát một lần rồi phục hồi tốc độ MP3 trước đó. Không đổi tốc độ chính người dùng đã thiết lập.
- **Số lần nghe lại**: vô hạn, 1, 2, 3, 5, 10 lần (áp dụng vòng lặp bản ghi giọng mình và so sánh). Điều khiển A–B và lặp danh sách giữ nguyên hành vi cũ.
- **Âm báo REC** (bật/tắt trong Cài đặt); thử phát một tiếng nhỏ khi ghi và khi kết thúc, phụ thuộc quyền âm thanh WebView.
- **Giao diện dễ đọc** cho người lớn tuổi; **giao diện sáng/tối**, hỗ trợ phóng to trình duyệt bằng hai ngón tay. Chỉnh cỡ chữ cũ vẫn được giữ nguyên.
- **Thêm hoặc chỉnh nghĩa tiếng Việt của từng câu**: chọn câu, nhấn nút `✎` ở khung luyện, nhập nghĩa, lưu. Chỉ lưu cục bộ, không sửa file SRT gốc. Xóa nội dung và nhấn Lưu để trả về nghĩa trong SRT (nếu có).
- **Bổ sung 36 mục IPA** còn thiếu từ bài `03 ADDITIONAL PRAYER.srt`, không thay các mục IPA đã tồn tại. Từ không có IPA hiển thị bằng dấu `⟨từ⟩` thay vì giả dạng phiên âm đúng. Nên nhờ người biết phát âm tiếng Anh kiểm tra các tên riêng Phật học và biến thể vùng miền.
- **Ghi âm**: giữ nguyên IndexedDB `tungkinh3-recordings-v1` và cách lưu đã có. Sửa lỗi lưu `folderHandle` vào metadata store **không có keyPath**. Có chọn xuất toàn bộ/bài đang mở/trong ngày; hiển thị số bản ghi và dung lượng gần đúng; ZIP bản ghi kèm `tungkinh3-cai-dat.json` để dự phòng tùy chọn.
- **Sao lưu và khôi phục lựa chọn** `.json` (vị trí học, dấu sao, nghĩa tiếng Việt, cỡ chữ, giao diện, cài đặt nghe). File JSON không chứa file ghi âm; bản ghi cần xuất ZIP riêng.
- **Cài đặt mặc định tách file `app-config.js`** để quản lý dễ hơn. Những lựa chọn đã lưu của người dùng được ưu tiên hơn mặc định.
- **Kiểm thử tự động** đã sửa `tests/smoke.py` để đọc cấu trúc `tracks.json` thực tế. Bổ sung `tests/verify_apphub_shared.py` để kiểm tra các file dùng chung sau khi App Hub thu thập module.
- **Offline**: thêm `app-config.js` và `enhancements.css` vào cache nội bộ, **giữ lại tên cache v4** để không tự xóa MP3 đã lưu offline từ trước; không đổi các đường dẫn MP3/SRT dùng chung và không nhân bản bài 01/02.

## 2. Cách sử dụng

**Luyện câu:** Nhấn Câu trước/Câu tiếp hoặc nhập số câu để chuyển. Nút `🔊 Nghe mẫu` dùng tốc độ đang chọn, `🐢 Mẫu 0.75×` nghe chậm, `REC` ghi âm; tiếp tục sử dụng Nghe lại và So sánh như trước. Có thể bật/tắt âm báo REC trong Cài đặt. Giọng mình có thể được phát sau REC **như chức năng cũ**; ứng dụng **không tự ghi câu kế tiếp**.

**Lặp A–B:** Chọn mốc A và B trên trình phát; nhấn lần ba để dừng.

**Lặp DS câu:** Tích câu hoặc nhấn `Chọn ☆` / `Chọn ⚑` để nạp các câu đã đánh dấu, rồi nhấn Bắt đầu lặp. Đánh dấu sao không đồng nghĩa với tích chọn câu. Các ô chọn được nhớ lại theo từng bài.

**Cài đặt:** Nhấn biểu tượng hoa sen → Cài đặt: giao diện, kích thước chữ, số lần nghe lại, âm báo REC, lưu bản ghi, xuất ZIP hoặc xuất/nhập `.json` lựa chọn. Phóng to bằng hai ngón tay tùy khả năng WebView.

**Chỉnh nghĩa:** Khi đang chọn một câu trong Luyện câu, nhấn `✎`, nhập nghĩa tiếng Việt rồi Lưu. Không có dịch tự động hoặc internet, tránh dịch sai thuật ngữ Phật học.

## 3. Các file chính

| File | Chức năng |
|---|---|
| `index.html` | Ba chức năng, hiển thị phụ đề, đánh dấu, nghĩa Việt, tiến độ, giao diện |
| `practice.js` | Luyện đọc, microphone, phát mẫu, lưu và xuất bản ghi |
| `practice.css` / `enhancements.css` | CSS gốc và CSS cải tiến |
| `app-config.js` | Cài đặt mặc định dành cho thiết bị chưa từng sử dụng |
| `tracks.json` | Ba bài và đường dẫn MP3/SRT (bao gồm dùng chung KinhTest2) |
| `IPA.txt` | Từ điển IPA dạng 2 dòng / mục, bổ sung 36 mục |
| `sw.js` | Bộ nhớ đệm PWA cho tài nguyên thuộc scope của Tụng Kinh 3 |
| `apphub.json` | Metadata phiên bản 1.2.0 của module |
| `tests/smoke.py` | Kiểm tra tĩnh repo |
| `tests/verify_apphub_shared.py` | Kiểm tra MP3/SRT sau khi App Hub tập hợp hai module |

## 4. Vì sao KHÔNG sao chép MP3 từ KinhTest2?

`tracks.json` đã có 3 bài. Bài 01 và 02 truy cập `../kinhtest2/...`, có cả tên dạng `#U...` và tên Unicode dự phòng; bài 03 dùng MP3/SRT tại repo này. **Các đường dẫn và file gốc được giữ nguyên**. Nếu App Hub đã đóng gói cả `kinhtest2` và `tungkinh3` cùng cấp trong `public/modules/`, chúng có thể chạy offline bằng tài nguyên sẵn có của App Hub.

`sw.js` riêng của module **không bảo đảm lưu được URL ở ngoài phạm vi** `tungkinh3/` khi dùng một PWA độc lập. Điều này không chứng minh bản App Hub của bạn bị lỗi; bạn đã xác nhận có thể nghe đủ bài offline. Không cần sửa cơ chế App Hub đang hoạt động chỉ vì vấn đề scope đó.

## 5. Kiểm tra và xuất bản một lần

1. Trước khi thay code, trong bản hiện tại hãy vào **Cài đặt → Xuất tất cả (.zip)** để sao lưu bản ghi; không gỡ ứng dụng hoặc xóa dữ liệu. Nếu dùng riêng Tụng Kinh 3 trên website, sao lưu tại chính website đó. Dữ liệu của mỗi origin/WebView có thể riêng biệt.
2. Đưa **toàn bộ file/thư mục** trong ZIP bản 1.2.0 lên **gốc repo `tungkinh3`**, ghi đè file cũ. Không đưa thêm MP3/SRT bài 01 và 02.
3. Kiểm tra tĩnh tại gốc repo: `python3 tests/smoke.py`. Cũng có thể kiểm tra cú pháp: `node --check practice.js` và `node --check sw.js`.
4. Ở repo App Hub, thu thập lại hai module `kinhtest2` và `tungkinh3`, sau đó kiểm tra bằng một trong các cách:
   - Nếu `tests/` đã được copy vào gói thu thập: `python3 public/modules/tungkinh3/tests/verify_apphub_shared.py public/modules`
   - Nếu `tests/` bị loại khỏi gói: dùng bản script từ repo Tụng Kinh 3 tại `tests/verify_apphub_shared.py` và truyền đường dẫn `public/modules`, hoặc copy script này tới `App-Hub/scripts/verify_apphub_shared.py` khi GitHub Actions hiện có cần đúng đường dẫn đó.
5. Chạy workflow **Publish Offline Web OTA** của App Hub (sau khi lấy phiên bản module mới), kiểm tra kết quả thực tế trên thiết bị. Nếu App Hub yêu cầu đóng rồi mở lại để kích hoạt, hãy thực hiện.
6. Thử không có Internet: cả ba bài phát và tua được; kiểm tra `4/10`, đánh dấu, ghi âm, export, chế độ sáng/tối, mở lại vẫn nhớ bài/câu và bản ghi.

**Không cần APK mới** cho những thay đổi HTML/CSS/JS/cache của module này **nếu App Hub hiện tại đã hỗ trợ cập nhật và kích hoạt gói OTA web**. Không đụng `AndroidManifest.xml`, native microphone service, foreground notification hay launcher icon. Không thể xác minh đường đi OTA, quyền micro hoặc sự tương thích Android nếu không có mã nguồn App Hub/APK đang cài và thiết bị thực.

## 6. Các lưu ý dữ liệu và vận hành

- Giữ `DB_NAME = tungkinh3-recordings-v1`: **không tạo DB mới và không xóa bản ghi cũ**. Sửa metadata sử dụng `put({value}, key)` tương thích với store hiện hành không có keyPath.
- LocalStorage ghi nhớ chế độ, font, dấu sao, câu khó, nghĩa tiếng Việt, danh sách đã chọn. Dữ liệu cũ không được tự xóa. Việc mở trang dưới một origin/địa chỉ khác có thể làm bạn thấy dữ liệu không còn, dù thực tế là không cùng kho.
- ZIP xuất bản ghi **không tự nhập lại ghi âm**. JSON lựa chọn có thể nhập lại ở Cài đặt; hãy giữ file ZIP ghi âm trong Downloads/Files.
- Thư mục Android tự ghi chỉ khả dụng khi WebView hỗ trợ File System Access API và đã cấp quyền. Nếu không hãy xuất ZIP/tải thủ công. Âm báo REC và phát chậm cần thử thực tế trên WebView.
- IPA còn tùy phương ngữ và từ chuyên ngành; bản này không dùng API phiên âm tự động. Khi thấy `⟨từ⟩`, cần bổ sung từ vào `IPA.txt` với đúng 2 dòng (từ tiếng Anh + phiên âm).
- Bản test trong môi trường phát triển: đã chạy Python static smoke, Node parse/check và mô phỏng JS. **Chưa thử ghi âm/microphone trong APK Android thật**; hãy thử trước trên một thiết bị và có bản sao lưu.

## 7. Kiểm thử sau OTA

- [ ] Chọn bài 03, chọn câu 4 → góc trên hiển thị `4/11` (bài 03 hiện có 11 đoạn SRT, bao gồm câu đầu có chỉ số SRT 0).
- [ ] Đang nghe MP3, bộ đếm cập nhật theo câu đang phát; thử lặp A–B và lặp DS câu.
- [ ] Đánh dấu ☆/⚑, đổi bài rồi quay lại, đóng/mở app: dấu vẫn còn.
- [ ] Nhập nghĩa tiếng Việt, kiểm tra lưu và khôi phục JSON.
- [ ] Nghe mẫu ở 0,75× rồi nghe toàn bài, tốc độ toàn bài không bị thay đổi.
- [ ] Ghi âm/so sánh/ZIP, kiểm tra lịch sử bản ghi có trước bản OTA.
- [ ] Bật giao diện tối và dễ đọc, quay lại ứng dụng vẫn giữ.
- [ ] Chạy offline trên App Hub, tua thử tất cả bài 01/02/03.
