# TỤNG KINH 3 — APK RIÊNG, OTA VÀ TỰ NHẬN TÊN MP3/SRT

## 1. Bạn KHÔNG cần đổi tên MP3/SRT

Chép nguyên tên từ KinhTest2 vào `media/kinhtest2/`, ví dụ:

```text
media/kinhtest2/
├── 01 Kinh nhac CHANH TINH TAN eng.mp3
├── 01 Kinh nhac CHANH TINH TAN eng.srt
├── 02 Kinh doc CHANH TINH TAN eng.mp3
├── 02 Kinh doc CHANH TINH TAN eng.srt
└── HUONG_DAN_CHEP_MP3_SRT.txt
```

**Đây chỉ là ví dụ tên file. Bạn giữ nguyên tên thật, kể cả dấu tiếng Việt và khoảng trắng.** Bài 03 `03 ADDITIONAL PRAYER.mp3` và `.srt` đã ở thư mục gốc repo, không chép trùng.

Bộ nhận diện trong `scripts/discover_media.py`:

- Tự tìm mọi cặp `.mp3` + `.srt` **cùng tên trước dấu chấm phần mở rộng, cùng thư mục**. Không phân biệt chữ hoa/thường, chuẩn hóa khoảng trắng và dấu Unicode.
- Dựa vào số đầu tên (`01`, `02`, `03`, `04`...) để sắp thứ tự. Bài thêm mới được đưa vào danh sách tự động. File không có số ở đầu sẽ xếp sau các bài có số.
- **Không ghép bừa** MP3 với SRT khác tên. Nếu thiếu cặp, file SRT sai định dạng hoặc có hai bài trùng số, workflow OTA sẽ dừng và in rõ lỗi.
- Khi đóng APK/OTA, script tạo `www/tracks.json` từ tên file thật. File `tracks.json` ở **gốc repo** chỉ giữ thông tin bài cũ và đường dẫn dự phòng cho App Hub/PWA; **không phải chỉnh thủ công**.
- Tên file có dấu `#` cũng được xử lý khi mở qua WebView. Không đổi tên tệp trên máy của bạn.

## 2. Cấu trúc repo

```text
tungkinh3/
├── .github/workflows/
│   ├── build-apk-debug.yml          # Build TungKinh EV Debug + Release khi có khóa
│   └── publish-ota.yml              # Publish bản web OTA lên Pages
├── media/kinhtest2/                 # Chép file MP3/SRT tên gốc vào đây
├── scripts/
│   ├── discover_media.py            # QUÉT TÊN GỐC, tự tạo danh sách bài
│   ├── validate_media.py            # Kiểm tra bắt buộc trong workflow OTA
│   ├── build-web.mjs                # Tạo www/ + đường dẫn chính xác
│   ├── package_ota.py               # ZIP OTA + SHA-256 + latest.json
│   ├── prepare_version.py
│   └── patch_android.py
├── src/                             # Bộ cập nhật native Capacitor
├── tests/                           # Kiểm thử web, OTA, nhận diện tên file
├── 03 ADDITIONAL PRAYER.mp3/.srt
├── tracks.json                      # Metadata/phương án dự phòng cho bản Web
├── package.json
└── index.html ...
```

## 3. Lần đầu đưa repo lên GitHub

1. Giải nén ZIP, upload **toàn bộ nội dung bên trong** `tungkinh3-main/` lên **gốc repo** (không lồng thêm một thư mục `tungkinh3-main`). Nên dùng GitHub Desktop/Git để giữ `.github/workflows`.
2. Nếu chưa chép file bài 01/02, vẫn có thể build **APK thử với bài 03**. Tới khi bổ sung đủ 4 file, bạn chỉ cần chạy OTA; không cần cài lại APK.
3. Nếu repo GitHub của bạn là `gptlohoi-del/tungkinh3`, OTA mặc định sử dụng `https://gptlohoi-del.github.io/tungkinh3/`. Nếu khác tên repo, cấu hình biến trong GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**; tên `TK3_OTA_BASE_URL`, giá trị `https://TEN-USER.github.io/TEN-REPO/` (có dấu `/` cuối). Tốt nhất cấu hình trước khi build APK đầu tiên.

## 4. Build TungKinh EV APK (Debug và Release tùy chọn)

1. Vào GitHub → **Actions → Build TungKinh EV APK → Run workflow** (chọn nhánh `main`).
2. Workflow tự kiểm thử, tạo `www/`, tạo Android project, đặt tên ứng dụng **TungKinh EV** và sử dụng icon hình chắp tay trong `android-assets/res`.
3. Không cần GitHub Secrets: tải Artifact `TungKinh-EV-1.2.N-debug`, giải nén lấy file `TungKinh EV-1.2.N-debug.apk` (N là số lần chạy workflow).
4. Nếu có đủ bốn Secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`, workflow cũng tạo Artifact Release, chứa file `TungKinh EV-1.2.N.apk` ký cùng khóa cố định.
5. Cấp quyền microphone khi được hỏi; thử bài 03, ghi âm, bật chế độ máy bay và kiểm tra nội dung offline.

**Quan trọng:** Chữ **TungKinh EV** dưới icon Android chỉ thay đổi sau khi cài APK mới; OTA không thể đổi icon launcher hay tên native đã được cài. Giữ nguyên `appId` để bảo toàn danh tính ứng dụng. Debug APK trên các GitHub runner khác nhau có thể có chữ ký khác nhau nên không bảo đảm cài đè được. Đối với điện thoại do quản trị viên quản lý, nên chốt bản Release ký cố định ngay từ đầu. Phiên bản APK `1.2.N` độc lập với số lần chạy workflow OTA; OTA vẫn dùng `web-version.json`. 

## 5. Phát hành OTA sau khi chép các bài 01/02

1. Giữ nguyên tên file, chép đủ 4 file vào `media/kinhtest2/` và đẩy lên GitHub.
2. Trên GitHub, mở **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Vào **Actions → Publish Tung Kinh 3 OTA (Pages) → Run workflow**.
4. Job gọi `npm run check:media`: phải có **đủ 01, 02, 03**, các cặp đúng tên và SRT hợp lệ, không trùng số bài. Sau đó script sẽ tự tạo `www/tracks.json`, đóng gói `www/` và tải lên Pages.
5. Mở `https://gptlohoi-del.github.io/tungkinh3/updates/latest.json` (hoặc địa chỉ bạn đã cấu hình), xác nhận có `version`, `url`, `sha256`.
6. Mở APK khi có Internet → **Cài đặt → Kiểm tra cập nhật** hoặc để app tự kiểm tra. Khi báo tải xong, đóng và mở lại ứng dụng. Kiểm tra bài 01, 02, 03 ở chế độ máy bay.

Nếu về sau bạn đổi tên file hoặc thêm bài `04 ...mp3` + `04 ...srt`, **chỉ cần upload và chạy Publish OTA**. Không sửa `tracks.json`, không build APK lại. Bản cập nhật web chỉ khả dụng nếu APK đã cài hỗ trợ OTA và kết nối tải được gói.

## 6. Nếu gặp lỗi

| Thông báo | Cách xử lý |
|---|---|
| Thiếu bài 01/02 | Chép cả MP3 và SRT của bài tương ứng, cùng tên gốc |
| Chưa đủ MP3 + SRT cùng tên | Kiểm tra cách viết, khoảng trắng và thư mục lưu; không ghép file khác tên |
| TRÙNG SỐ BÀI | Đổi số đầu của một cặp file thành số mới, ví dụ 04 |
| SRT không có mốc thời gian | Dùng file `.srt` thực sự; không dùng `.txt` tùy ý hoặc HTML |
| 404/latest.json | Kiểm tra Pages chọn GitHub Actions, chạy workflow Publish OTA thành công |
| Tải ZIP không thành công | Kiểm tra mạng, Pages và URL ZIP trong latest.json |
| Cài APK mới không đè APK cũ | Khóa debug khác; để tránh việc này phải có khóa Release cố định từ đầu |
| Không tìm thấy file trên điện thoại | Kiểm tra danh sách `www/tracks.json` trong gói web và các tệp đi kèm |

## 7. Cách kiểm tra nhanh trên PC

Cần Python 3.10+, Node.js 22+ và Internet cho lần đầu cài dependencies:

```bash
npm install
npm run test:repo
python3 scripts/discover_media.py --output www/tracks.json
npm run check:media             # Yêu cầu đủ bài 01, 02, 03
npm run build:web
npm run ota:package
```

`npm run build:web` sẽ tạo `www/tracks.json` tự động nên lệnh `discover_media.py` riêng là tùy chọn. Khi chưa chép 01/02, `npm run check:media` **dự kiến báo thiếu dữ liệu**, còn workflow APK thử có thể chạy với bài 03.

**Giới hạn:** Chỉ nội dung HTML/CSS/JS/IPA/MP3/SRT được OTA; thay đổi plugin native, quyền Android, icon launcher Android cần APK mới. Cần thử OTA và microphone trên điện thoại thật trước khi sử dụng chính thức. Không gỡ ứng dụng/xóa dữ liệu khi chưa xuất bản ghi âm và sao lưu cài đặt.
