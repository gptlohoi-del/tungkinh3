# tungkinh3 — Luyện nghe và luyện đọc từng câu

Ứng dụng web/PWA **ưu tiên Android (Chrome)**, phát triển từ bản gốc `kinhtest2-main`. Chạy bằng HTML/CSS/JavaScript tĩnh và **không cần tài khoản, máy chủ ghi âm hay dịch vụ bên ngoài**. Phù hợp triển khai miễn phí qua GitHub Pages.

## 1. Các tính năng giữ nguyên từ bản gốc

- Nạp và ghép các cặp MP3 + SRT/TXT (cùng tên), hiển thị tiếng Anh, tiếng Việt nếu có và IPA từ `IPA.txt`.
- Trình phát MP3 với các mức tốc độ từ **0.5x đến 1.5x**; tải MP3.
- Đồng bộ và tô sáng câu đang đọc; lặp đoạn A–B; lặp một hay nhiều câu đã chọn; chọn nhanh theo số/khoảng câu.
- Cài đặt kích thước chữ lưu trong `localStorage`.
- Nạp thư mục từ PC và kéo thả tệp; service worker để dùng offline với tài nguyên đã lưu.

## 2. Tính năng mới: luyện đọc và so sánh

1. Vào **🎙️ Luyện đọc từng câu**. Dùng **◀ Câu trước** hoặc **Câu tiếp ▶** ngay dưới khung câu để chuyển nhanh mà **không cần cuộn xuống danh sách**. Nút Câu trước bị khóa ở câu đầu; Câu tiếp bị khóa ở câu cuối. Khi đang REC, phải kết thúc ghi âm trước khi chuyển câu. Có thể nhấn **🎙 Luyện** tại bất kỳ câu nào trong danh sách để nhảy trực tiếp tới câu đó (không thay đổi checkbox của chế độ lặp nhiều câu). Khi mở bài mới, câu đầu tiên được chọn sẵn.
2. Nhấn **🎙 REC**, cho phép microphone (lần đầu), đọc câu, rồi nhấn **⏹ Kết thúc REC**.
3. **Ngay khi bản thu hoàn thành**, bản ghi mở trong trình phát và **tự phát lặp lại** với khoảng nghỉ. Việc lưu xuống bộ nhớ chạy sau khi bắt đầu phát, tránh chờ ghi file. Trình duyệt có thể chặn tự phát trong một số tình huống: nhấn nút Play trên bản ghi nếu có thông báo.
4. Nhấn **🔊 Nghe mẫu** để nghe một lần đúng đoạn MP3 được xác định bằng mốc thời gian của SRT (có khoảng đệm tùy chỉnh).
5. Nhấn **🔁 So sánh** để nghe *mẫu → nghỉ → bản ghi → nghỉ → mẫu…*; **⏹ Dừng phát** để dừng vòng lặp. Nhấn REC mới sẽ tự dừng phát cũ.
6. Nút **▶ Nghe lại giọng mình** dùng để quay lại chế độ chỉ nghe bản ghi. Trình phát bản ghi có thanh tua và Play riêng.

Trong Settings (nút hoa sen góc màn hình → tab **⚙️ Setting**), có thể thay đổi: khoảng nghỉ khi nghe giọng mình (0–10 giây, mặc định 2 giây); khoảng nghỉ giữa mẫu và bản ghi (0–10 giây, mặc định 1.5 giây); lặp vô hạn/5/10 lần; đệm MP3 (0–1 giây, mặc định 0.1); bật/tắt tự phát khi kết thúc REC.

## 3. Lưu bản ghi — thiết kế cho Android

Trong **Settings → Lưu bản ghi** có **ba chế độ**:

- **Không lưu**: chỉ giữ bản vừa thu trong phiên hiện tại; có thể xuất bản đó qua **⬇ Lưu bản ghi hiện tại**.
- **Lưu bản gần nhất** *(mặc định)*: mỗi câu/bài lưu một bản gần nhất trong **IndexedDB** trên thiết bị.
- **Lưu nhiều lần**: mỗi lượt thu là một bản độc lập; có thể nghe, xuất, xóa từ mục *Bản ghi đã lưu của câu này*.

Với hai chế độ có lưu, chọn nơi lưu:

- **Bộ nhớ ứng dụng** *(mặc định, khuyến nghị)*: lưu bằng IndexedDB, không cần chọn lại chỗ lưu khi REC. Dữ liệu vẫn ở máy, **không upload ghi âm lên GitHub**.
- **Thư mục tôi chọn** *(tùy khả năng trình duyệt)*: người dùng nhấn **📂 Chọn thư mục lưu** để cấp quyền. Ứng dụng vẫn lưu **bản sao trong IndexedDB** và cố gắng ghi thêm file vào thư mục nếu quyền còn hiệu lực. Quyền có thể bị thu hồi khi đóng tab/ứng dụng; nếu không thể tự ghi, thông báo hiển thị trong ứng dụng và bản lưu tại IndexedDB vẫn giữ nguyên.

**Android / Chrome:** quyền truy cập thư mục trực tiếp không phải lúc nào cũng được hỗ trợ. Khi đó sử dụng nút **⬇ Lưu bản ghi hiện tại** (lưu/chia sẻ theo trình duyệt) hoặc **📦 Xuất tất cả (.zip)** để lưu về *Downloads* và quản lý bằng ứng dụng *Files / Tệp* trên điện thoại. Không thể cam kết web app chọn được bất kỳ thư mục nào trên mọi điện thoại.

⚠️ **IndexedDB có thể bị xóa nếu dọn dữ liệu trình duyệt, xóa ứng dụng PWA, hết dung lượng hoặc cơ chế thu hồi lưu trữ của hệ điều hành.** Hãy xuất ZIP định kỳ. Khi chọn “Lưu bản gần nhất”, những bản cũ cho câu đó sẽ bị thay thế trong IndexedDB; các file đã xuất ra ngoài không được tự động xóa.

Bản ghi được lưu theo định dạng do trình duyệt hỗ trợ (thường là **WebM/Opus** trên Chrome Android); đây **không phải MP3**. Tên file xuất có thông tin bài, số câu, thời điểm ghi.

## 4. Chạy và triển khai

### GitHub Pages

1. Tạo repository tên **`tungkinh3`** trong tài khoản GitHub của bạn.
2. Giải nén toàn bộ nội dung ZIP vào **thư mục gốc** của repository (bao gồm `index.html`, `practice.js`, `practice.css`, `manifest.json`, `sw.js`, `tracks.json`, MP3/SRT và `IPA.txt`).
3. Vào **Settings → Pages → Build and deployment → Deploy from a branch**, chọn `main` / `(root)` và lưu.
4. Mở `https://<ten-github>.github.io/tungkinh3/` trên Chrome Android. Nếu muốn, chọn **Add to Home screen / Thêm vào màn hình chính**.
5. Cho phép microphone khi REC lần đầu. HTTPS là bắt buộc khi ghi âm từ trình duyệt (ngoại trừ localhost).

### Kiểm tra trên PC (localhost)

```bash
cd tungkinh3
python -m http.server 8000
# Truy cập http://localhost:8000/
```

Không nên mở `index.html` trực tiếp bằng `file://` để kiểm tra REC và tải dữ liệu. Đường dẫn `localhost` được coi là ngữ cảnh an toàn cho microphone trên máy đang chạy server; trên **điện thoại khác**, hãy sử dụng HTTPS như GitHub Pages.

## 5. Thêm hoặc thay đổi bài đọc

- Đưa các cặp `TenBai.mp3` và `TenBai.srt` (hoặc `.txt` có cấu trúc thời gian giống SRT) **cùng tên gốc** vào repository. SRT được đánh số 0 hay 1 đều được.
- Nội dung câu có thể là `English | Tiếng Việt` hoặc chỉ có `English`.
- GitHub Pages: chương trình quét file qua GitHub API và có **`tracks.json` dự phòng** khi offline/không gọi được API. Khi thêm bài mới, cập nhật `tracks.json` thành danh sách tên file MP3/SRT (mảng JSON) để bảo đảm khả năng dự phòng; nếu dùng API online thì không bắt buộc cập nhật ngay.
- Audio + SRT có trong repo gốc được giữ nguyên. Cột thời gian của SRT quyết định phần MP3 được phát khi nghe mẫu.

## 6. Offline, quyền truy cập và giới hạn

- Service worker cache mã nguồn, giao diện và SRT/IPA. File MP3 tải và cache khi mở; hãy **mở bài lúc online ít nhất một lần** trước khi dùng offline. Dữ liệu ghi âm nằm riêng trong IndexedDB, không đưa vào cache của service worker.
- Chrome/Android có thể khóa màn hình, dừng phát nền, thu hồi quyền microphone hoặc tắt trang khi thiếu tài nguyên. Phát lặp được thiết kế cho lúc ứng dụng đang mở.
- Không tự ghi ra thư mục nếu trình duyệt không hỗ trợ API hoặc chưa được cấp quyền; dùng Xuất file/ZIP trong trường hợp đó.
- Sau khi đổi chế độ lưu, bản ghi cũ trong IndexedDB **không tự bị xóa**. Xóa thủ công bằng nút xóa tại lịch sử bản ghi.
- Một câu chỉ ghi một bản tại một thời điểm, không ghi khi phát âm thanh mẫu để tránh tiếng vang.
- Các bản ghi không được đưa lên mạng; trừ trường hợp người dùng tự chia sẻ/xuất file ra ngoài.

## 7. Cấu trúc dự án

```text
tungkinh3/
├── index.html          # Giao diện và chức năng gốc + điểm gắn luyện đọc
├── practice.js         # REC / playback / IndexedDB / ZIP / truy cập thư mục
├── practice.css        # Giao diện luyện đọc phù hợp màn hình cảm ứng
├── sw.js               # Cache offline
├── manifest.json       # Cài đặt PWA
├── tracks.json         # Danh sách MP3/SRT để dự phòng khi không quét được
├── IPA.txt             # Dữ liệu IPA gốc
├── icon-192.png / icon-512.png
├── *.mp3 / *.srt       # Audio và phụ đề bản gốc
└── README.md
```

## 8. Checklist kiểm thử thực tế trên Android

- [ ] Mở từ Chrome Android bằng HTTPS; cấp quyền microphone.
- [ ] Nghe bài MP3 cũ, dùng tốc độ, A–B, chọn nhóm câu và lặp như trước.
- [ ] Bấm Câu tiếp / Câu trước, kiểm tra số câu, nội dung và lịch sử bản ghi đổi đúng; nút không cho vượt câu đầu/cuối.
- [ ] Chọn câu, REC → dừng REC → bản ghi tự phát lặp với khoảng nghỉ; nhấn Dừng.
- [ ] Nghe mẫu 1 lần và so sánh mẫu/giọng mình theo chu kỳ.
- [ ] Đổi câu và bài khi đang phát, kiểm tra không có âm thanh chồng nhau.
- [ ] Thu hai lần với mỗi chế độ lưu, đóng/mở lại app, kiểm tra lịch sử.
- [ ] Xuất bản ghi hiện tại và ZIP; kiểm tra file xuất trong Downloads/Files.
- [ ] Chọn thư mục nếu Chrome thiết bị hỗ trợ; nếu không thì xuất ZIP dự phòng.
- [ ] Mở bài một lần online, tắt mạng và kiểm tra trình phát theo cache sẵn có.

---

**Nguồn**: `kinhtest2-main.zip` do người dùng cung cấp. Bản mã này không tự tạo repository online; để đưa lên GitHub cần thao tác upload/push vào tài khoản của bạn.
