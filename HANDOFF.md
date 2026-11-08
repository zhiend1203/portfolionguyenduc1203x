# Bàn giao: Portfolio animation.gripe

Tài liệu tóm tắt để tiếp tục công việc ở một phiên chat khác.

## Mục tiêu
Đưa trang portfolio 2D animator của **Nguyen Minh Duc** lên domain **https://animation.gripe**.

## Trạng thái hiện tại (2026-11-08)

| Hạng mục | Trạng thái |
|---|---|
| Code trang web | ✅ Xong, trên GitHub |
| Cloudflare Pages project | ✅ `duc-portfolio`, nối GitHub, tự deploy mỗi lần push |
| Bản đang chạy | ✅ https://duc-portfolio-1to.pages.dev (commit `8288366`) |
| Domain `animation.gripe` | ⏳ Đã đăng ký vào project Pages, **chưa trỏ DNS** |
| Trang studio cũ | Vẫn đang chiếm `animation.gripe` qua một **Worker custom domain** |

## Repo
- GitHub: `zhiend1203/portfolionguyenduc1203x`
- Nhánh: `claude/mcp-upwork-cloud-djr0do` (đây là production branch của Pages)

### Cấu trúc file
| File | Nội dung |
|---|---|
| `index.html` | Toàn bộ nội dung trang |
| `styles.css` | Style đen trắng xám, nền lưới |
| `main.js` | Intro, typewriter, tab Portfolio, modal video, hiệu ứng cuộn. Đầu file có danh sách chữ chạy, mô tả tab, danh sách tool |
| `lanyard.js` | Thẻ tên treo dây, mô phỏng vật lý verlet, kéo thả được |
| `projects.js` | Danh sách video (Google Drive file ID + tên). Sửa tên video ở đây |
| `vendor/` | GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (tự host, không dùng CDN) |
| `assets/` | Ảnh đại diện, logo Moho, AE, PR, PS, AI |
| `_headers` | Header cache cho Cloudflare Pages |

### Style (lấy theo video TikTok tham khảo)
- Intro màn đen, chữ "Welcome to my Animation Portfolio" hiện dần từng chữ.
- Thanh menu dạng viên thuốc nổi; phần đầu trang có chữ tự gõ; thẻ tên treo dây đeo kéo được.
- About có ảnh tròn và 3 ô thống kê.
- Portfolio Showcase có 4 tab: Commercials / YouTube Series / Shorts / Tools.
- Contact gồm 2 card kính mờ, nút liên hệ dẫn tới Upwork.

## Cloudflare
- Zone `animation.gripe`: ID `d7cfc18edb0fefcc97a9bec34070e70c`
- Account ID: `aaee8c062cf85058177680c5b381fb9d`
- Pages project: `duc-portfolio` → `duc-portfolio-1to.pages.dev`
- DNS hiện có: MX, SPF, DKIM của **Zoho Mail**. **Không xoá** mấy bản ghi này. Bản ghi `AAAA animation.gripe 100::` là của Worker cũ, đang ở chế độ chỉ đọc.

### API token
- Tên token: **"for claude"**, quyền hiện có:
  - Zone DNS: Edit
  - Zone: Read
  - Account Cloudflare Pages: Edit
- Token được lưu dạng network secret trong môi trường cloud **`portfolionguyenduc1203x`**. Phiên mới phải chạy trong môi trường này thì mới gọi được `api.cloudflare.com`. Proxy tự chèn token vào request, không cần ghi giá trị token ra.
- ⚠️ Proxy ghi đè header `Authorization`, nên `wrangler pages deploy` (dùng token upload tạm riêng) **không chạy được**. Phải deploy qua Git integration: push lên nhánh là xong.

## Việc còn lại
1. **Người dùng:** sửa token "for claude", thêm quyền **Account → Workers Scripts → Edit**.
2. **Claude**, qua API:
   - Tìm Worker đang giữ domain: `GET /accounts/{A}/workers/domains`.
   - Gỡ domain khỏi Worker: `DELETE /accounts/{A}/workers/domains/{domain_id}`. Chỉ gỡ domain, **không xoá** Worker.
   - Tạo DNS: `CNAME animation.gripe → duc-portfolio-1to.pages.dev`, bật proxied.
   - Kiểm tra `GET /accounts/{A}/pages/projects/duc-portfolio/domains/animation.gripe` cho tới khi `status: active`.
3. Người dùng mở https://animation.gripe để kiểm tra:
   - Có intro, thẻ treo, animation.
   - Thumbnail video có hiện không (lấy từ `drive.google.com/thumbnail`).
   - Bấm video có phát không (nhúng Google Drive `/preview`).

## Ghi chú khác
- Video nằm ở thư mục Drive **PORT**, chia sẻ "ai có link cũng xem được": https://drive.google.com/drive/folders/1tu2A_eCOG2XAAoZri2DWwg5rVXacM98R
- Profile Upwork: https://www.upwork.com/freelancers/~01a592f6d08bd9ef2b
- Tên video đang lấy theo tên file (ví dụ "Final Cut 01", "Team Project 1–4"). Cần người dùng cho tên thật.
- Không đưa email cá nhân lên trang khi chưa được người dùng đồng ý.
- Ý tưởng chưa làm: form liên hệ gửi về email (dùng Cloudflare Pages Functions hoặc dịch vụ form).
