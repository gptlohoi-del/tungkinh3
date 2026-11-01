# TỤNG KINH 3 — FULL SOURCE: APK Hybrid + OTA + Tự nhận tên MP3/SRT

Đây là mã nguồn hoàn chỉnh để tạo **Tụng Kinh 3 APK riêng**, sử dụng offline và ưu tiên OTA qua GitHub Pages. Phiên bản web cơ sở v1.2.0. **Không thêm chế độ luyện đọc tự động.**

**Bạn không cần đổi tên MP3/SRT thành `01.mp3`, `02.mp3` nữa.** Chép file tên gốc vào `media/kinhtest2/`. Khi build APK hoặc xuất bản OTA, `scripts/discover_media.py` tự nhận diện theo từng cặp file cùng tên, tự sinh `www/tracks.json`, kể cả bài 04, 05 về sau.

- [Hướng dẫn đầy đủ: upload GitHub, build APK, cập nhật OTA](HUONG_DAN_APK_OTA.md)
- [Quy tắc chép MP3/SRT](media/kinhtest2/HUONG_DAN_CHEP_MP3_SRT.txt)
- [Hướng dẫn sử dụng chức năng web](README_WEB.md)

**GitHub Actions:**

- `Build Tung Kinh 3 APK Debug` — tạo APK Debug có chữ ký tự động, không cần tự tạo key/Secrets; cho phép thử với bài 03 trước.
- `Publish Tung Kinh 3 OTA (Pages)` — yêu cầu đủ bài 01–03 và phát hành bản cập nhật web; **không build APK lại**.

`tracks.json` ở gốc repo giữ metadata bài cũ và fallback App Hub, còn **`www/tracks.json` được sinh lại từ MP3/SRT thật trên mỗi lần build**. Không sửa tay danh sách bài.

Lưu ý: đây là mã nguồn để chạy CI, cần kiểm thử GitHub Actions và thử trực tiếp trên Android trước khi xem như bản phát hành chính thức. Nếu cần nâng cấp APK native về sau, chữ ký Debug ở hai lần build có thể khác nhau; nên có khóa Release cố định trước khi triển khai lâu dài.
