/* TỤNG KINH 3 — Chỉ sửa tập tin này để thay đổi các giá trị mặc định cho thiết bị MỚI.
 * Cài đặt đã lưu của người sử dụng luôn được ưu tiên. Không xóa dữ liệu khi cập nhật OTA.
 * Không thay đổi đường dẫn MP3/SRT: cấu hình đó vẫn nằm trong tracks.json.
 */
window.TK3_DEFAULTS = Object.freeze({
    appearance: { theme: 'light', easy: false },
    playbackSpeed: 1,
    practice: {
        selfPause: 2,
        comparePause: 1.5,
        repeatCount: 0,        // 0=vô hạn; còn có 1,2,3,5,10
        padding: 0.10,        // giây trước/sau câu mẫu
        autoReplay: true,    // tự phát giọng mình sau REC (KHÔNG phải luyện đọc tự động)
        cue: true,           // âm báo REC
        storageMode: 'latest', // temporary / latest / multiple
        storageLocation: 'app' // app / folder (nếu trình duyệt hỗ trợ)
    }
});
