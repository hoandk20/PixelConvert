# Pixel 32x32 Batch Converter

Web tĩnh để convert nhiều ảnh thường sang ảnh pixel art kích thước nhỏ như `32x32`.

## Chạy local

Mở trực tiếp file `index.html` trong trình duyệt hoặc chạy server tĩnh:

```bash
python3 -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

## Tính năng

- Kéo thả hoặc chọn nhiều ảnh cùng lúc
- Convert hàng loạt sang `32x32`, `16x16`, hoặc `64x64`
- Hỗ trợ `contain`, `cover`, `stretch`
- Cho phép nền trong suốt hoặc nền màu cố định
- Preview ảnh gốc và ảnh pixel ngay trên web
- Tải từng ảnh PNG hoặc tải hàng loạt
