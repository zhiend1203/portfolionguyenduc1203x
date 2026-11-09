# animation.gripe — Portfolio của Nguyen Minh Duc (2D Moho Animator)

Tài liệu tổng hợp dự án: cấu trúc, cách sửa, cách deploy, các lỗi đã gặp. Cập nhật: 09/11/2026.

---

## 1. Tổng quan

| | |
|---|---|
| **Web live** | https://animation.gripe |
| **Hosting** | Cloudflare Pages, project `duc-portfolio` (tự deploy khi push Git) |
| **Repo** | GitHub `zhiend1203/portfolionguyenduc1203x` |
| **Nhánh production** | `claude/mcp-upwork-cloud-djr0do` (push vào đây = lên web) |
| **Nhánh làm việc** | `v2-scroll-3d` |
| **Kiểu web** | Static HTML/CSS/JS, không build step |
| **Thư viện** | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Three.js (chỉ dùng cho bóng Toolkit). Tự host trong `/vendor` |
| **Font** | Anton, Space Grotesk, Inter, JetBrains Mono (Google Fonts, tải không chặn) |

**Concept:** lăn chuột 1 nhịp hoặc vuốt 1 lần thì sang 1 trang, mỗi trang có animation vào riêng. Một **card 2D có ảnh Đức** bay theo suốt các trang: lật mặt, đổi vị trí, kéo được, rê/chạm vào thì hiện thông tin và nút liên hệ.

---

## 2. Thứ tự các trang

| # | ID | Nội dung | Card |
|---|---|---|---|
| 0 | `#home` | "MOHO 2D ANIMATOR", hàng liên hệ nhanh (email, SĐT, Facebook, Discord), marquee chạy | Mặt ảnh, to, bên trái |
| 1 | `#about` | Đoạn giới thiệu (chữ sáng dần), số liệu 1000+ / 500+ / 5+ | Lật sang mặt ID |
| 2 | `#services` | WHAT I DO: Character Animation, Rigging, Edit & Composite | Lật lại mặt ảnh |
| 3 | `#process` | HOW IT MOVES: Brief, Rig & design, Animate, Deliver | Mặt ID |
| 4 | `#work` | MY WORK: 9 video nổi bật trượt ngang + ô "View all projects" | Thu nhỏ, góc dưới phải, kéo được |
| 5 | `#shorts` | SHORTS: các video dọc xòe ra như bài | Thu nhỏ, kéo được |
| 6 | `#tools` | MY TOOLKIT: bóng vật lý (Three.js) rơi xuống, rê chuột đẩy được | Thu nhỏ, kéo được |
| 7 | `#contact` | LET'S MAKE IT MOVE, 4 ô liên hệ, video reel chạy 4s/clip | Thu nhỏ, kéo được |

**Mobile:** từ trang About trở đi card nhỏ ở góc trên phải. Chạm vào card thì nó mở ra giữa màn hình, chạm ra ngoài hoặc chuyển trang thì đóng.

---

## 3. Cấu trúc file

```
index.html        Trang chính (bố cục pager có card)
v2.js             Toàn bộ logic: card, pager, animation từng trang, work, modal, reel, bóng
v2.css            Style gốc của bố cục pager
v2fix.css         Các bản vá/bổ sung (load sau v2.css), xem mục 6
projects.js       Danh sách dự án (commercial, tank, series/shorts) với Drive ID
vendor/           gsap, ScrollTrigger, lenis, three (tự host)
assets/           duc-card.jpg (ảnh card), avatar.jpg, logo tool (ae, ai, ps, pr, moho)
media/            p-*.mp4/jpg = preview 4s cho work card; h-*.mp4 = highlight 30s có tiếng (mở trong modal); hero.mp4
reel/             8 clip 4.2s cho video reel ở trang Contact
thumbs/           Thumbnail webp đặt tên theo Drive ID
_headers          Cache 7 ngày cho /assets, /thumbs, /reel
_redirects        /v2 → / (301)
v1/               Bản web đầu tiên (cũ)
v2-pager.html     Bản gốc của bố cục pager (tham khảo)
v3.*, v4.css      Bản bố cục "editorial" đã thử rồi bỏ, không còn dùng ở trang chính
```

---

## 4. Thông tin liên hệ trên web

- Email: zhiend1203@gmail.com
- Phone/Zalo: +84 389 730 028
- Facebook: https://www.facebook.com/nguyenduc1203/
- Discord: https://discordapp.com/users/426777851493351440
- Upwork: https://www.upwork.com/freelancers/~01a592f6d08bd9ef2b **(đang ẩn tạm thời)**

Các link nằm ở 3 chỗ: hàng liên hệ ở page 1 (`.hq`), mặt sau card (`.pb-links`), trang Contact (`.cx__links`).

**Bật lại Upwork:** xóa đoạn cuối trong `v2fix.css`:
```css
/* TEMP: Upwork links disabled — delete this block to bring them back */
a[href*="upwork.com"] { display: none !important; }
```

---

## 5. Sửa nội dung thường gặp

### Thêm / đổi thứ tự video ở My Work (`v2.js`)
- `NEWW`: các video local mới (có preview `media/p-*.mp4` và highlight `media/h-*.mp4`).
- `TOP`: **9 video hiện đầu tiên**. Hiện tại xếp video hoạt hình Moho lên trước: Vietnam Airlines → Rescue Pups 72 → Mech Battle 1209 → Poppy Trend Ep.5 → Ghidora Tank → Rescue Pups 73 → Boss 2 → Rescue Pups 79 → Episode 6.
- `SHOW = 9`: số video hiện ở trang Work. Phần còn lại vào overlay "View all projects" (hiện có 34 dự án).
- Video từ Drive thì thêm vào `projects.js` với `id` là Drive file ID (mở bằng iframe preview của Drive).

### Thêm video local mới
1. Cắt preview 4s, 960×540: `media/p-ten.mp4` + ảnh `media/p-ten.jpg`.
2. Cắt highlight khoảng 30s, 1280×720, có tiếng: `media/h-ten.mp4`.
3. Thêm vào `NEWW` và `TOP` trong `v2.js`.

### Đổi số liệu / chữ giới thiệu
Trong `index.html`: `data-count="1000"`, `data-count="500"`, `data-count="5"` và đoạn `.scrub-words`.

### Đổi ảnh card
Thay `assets/duc-card.jpg`, tỉ lệ 3:4.

---

## 6. Các bản vá quan trọng (đừng xóa)

| Vấn đề | Cách xử lý | Ở đâu |
|---|---|---|
| Màn 4K / Brave: `innerHeight` (2160) lớn hơn vùng nhìn thấy thật (1233) nên trang lệch, không cuộn được tới cuối | Hàm `VH()` lấy `visualViewport.height`, biến CSS `--vvh` đặt chiều cao từng trang | `v2.js` đầu file, `v2fix.css` |
| Mở link có `#about`, `#work`… thì trình duyệt tự nhảy làm trang lệch với card | Xóa hash khi load, chạy xong màn tải mới chuyển tới trang đó | `startHash` trong `v2.js` |
| Có gì đó làm cuộn thật bị lệch (Ctrl+F, focus, đổi cỡ màn hình) | Lớp "safety net": luôn ghim scroll về đúng trang hiện tại | `startPager()` |
| iPhone / Safari / app Threads không ẩn mặt sau của card, chữ bị ngược | JS tự tính góc lật, chỉ hiện mặt đang quay về phía người xem | `renderCard()` (`faceF`/`faceB`) |
| Safari tải chậm, màn hình đen | Font Google tải không chặn, bỏ autoplay video (chỉ chạy khi vào trang Work/View all), chốt an toàn 9s tắt loader | `index.html`, `v2.js` |
| Máy bật "reduce motion" làm mất animation | `const reduce = false` | `v2.js` |

---

## 7. Deploy

```bash
# làm việc trên nhánh v2-scroll-3d
git add -A && git commit -m "..."
git push origin v2-scroll-3d

# đưa lên production (Cloudflare tự deploy, khoảng 1–2 phút)
git checkout claude/mcp-upwork-cloud-djr0do
git merge --ff-only v2-scroll-3d
git push origin claude/mcp-upwork-cloud-djr0do
git checkout v2-scroll-3d
```

**Cache:** mỗi lần sửa CSS/JS thì tăng số phiên bản `?v=...` trong `index.html` (hiện là `p5q`) để trình duyệt lấy bản mới. Xem lại web: máy tính Ctrl+F5, điện thoại đóng tab mở lại.

**Quy ước:** luôn hỏi Đức trước khi push.

---

## 8. Domain & DNS

- `animation.gripe` đã gắn vào Pages project `duc-portfolio` (HTTPS ok).
- Worker cũ `animationgripte` vẫn còn nhưng đã gỡ domain.
- DNS mail Zoho (MX, SPF, DKIM): **không đụng vào**.

---

## 9. Việc còn tồn

- 16 dự án vẫn lấy thumbnail trực tiếp từ Drive (Stickman, Story, Shorts, GR-001, Boss 03, V-Raptor). Drive chặn hoặc chậm thì ô bị trống. Nên tải thumbnail về `thumbs/` rồi thêm ID vào `LOCAL_THUMBS` trong `v2.js`.
- Tên tạm chưa xác nhận: "Mech Battle 1209", "Episode 6", "Rescue Pups Ep. 72/73/79", "Among Crew", "Poppy Trend Ep. 5", "Stickman Special", "YOBEVE Alt cut", "Outro".
- Upwork đang ẩn, bật lại khi cần (mục 4).
- Dọn các file không dùng (`v3.*`, `v4.css`, `v2-pager.html`) nếu muốn repo gọn.
