# Thư viện & Công nghệ tham khảo (Referenced Libraries)

Tài liệu này tổng hợp các thư viện open source và công cụ nền tảng đã được tham khảo, phân tích và áp dụng (hoặc lên kế hoạch áp dụng) trong dự án Creator Studio.

## 1. Bảng vẽ & Thiết kế (Canvas Editor)
*   **[Tldraw SDK](https://github.com/tldraw/tldraw):** Công cụ cốt lõi cho phần chỉnh sửa ảnh/bảng vẽ (được lưu trong thư mục `reference/tldraw`). Cung cấp khả năng render Canvas (SVGs + HTML5), hệ thống hình khối (shapes), các công cụ cơ bản (Select, Hand, Eraser, Zoom) và nền tảng cho tính năng hợp tác (multiplayer).

## 2. Xử lý & Chỉnh sửa Video (Video Editor)
*   **[Remotion](https://github.com/remotion-dev/remotion):** Được sử dụng để xây dựng tính năng chỉnh sửa video bằng React components. Cho phép xử lý timeline trực quan, các hiệu ứng chuyển cảnh (transitions) và xuất file (rendering) qua FFmpeg.wasm hoặc server.

## 3. Trí tuệ Nhân tạo (AI Agents)
*   **[LangGraph](https://github.com/langchain-ai/langgraph):** Tham khảo kiến trúc luồng công việc phức tạp (DAG - Directed Acyclic Graph) để thiết kế các AI Agents xử lý theo chuỗi: Nghiên cứu nội dung $\rightarrow$ Viết $\rightarrow$ Chỉnh sửa.
*   **[OpenAI Agents SDK / AI SDK v6]:** Công cụ thực thi chính với TypeScript để xây dựng hệ thống đa tác nhân (Multi-agent workflows) xử lý các công việc thay cho LangGraph.

## 4. Quản lý Mạng Xã Hội (Social Media Management)
*   **[Postiz](https://github.com/gitroomhq/postiz-app):** Tham khảo luồng kiến trúc về kết nối đa nền tảng (OAuth), hệ thống lên lịch đăng bài (Scheduling via Temporal/Cron) và hệ thống phân tích đánh giá dữ liệu (Analytics).

## 5. UI/UX & Giao diện
*   **[shadcn-ui](https://ui.shadcn.com/):** Thư viện nền tảng cho các UI components được lưu trong `reference/shadcn-ui`.

## 6. Hàng đợi & Tác vụ ngầm (Background Jobs)
*   **[BullMQ](https://github.com/taskforcesh/bullmq):** Tham khảo và xử lý các hàng đợi công việc nền, được lưu trong `reference/bullmq`, có thể dùng cho luồng xử lý video hay đăng bài mạng xã hội kết hợp với Inngest.

## 7. Phân tích dữ liệu (Analytics)
*   **[Evidence.dev](https://github.com/evidence-dev/evidence):** Tham khảo kiến trúc SQL-first và WASM cho việc kết xuất biểu đồ và các số liệu phân tích mạng xã hội trực tiếp trên client.

## 8. Các công nghệ nền tảng & Tiện ích khác (Stack)
*   **Database & ORM:** Prisma
*   **Bảo mật & Xác thực:** Better Auth, Xác thực 2 lớp (TOTP/Authenticator apps).
*   **Mật khẩu:** Tham khảo zxcvbn cho thuật toán độ mạnh mật khẩu hoặc Regex custom.
*   **Email Templates:** Resend kết hợp với React Email components.
*   **Lưu trữ tài nguyên (Storage):** Cloudflare R2 / AWS S3.
*   **Đồng bộ thời gian thực (Real-time Collaboration):** Custom WebSocket kết hợp Redis Pub/Sub (thay vì phụ thuộc `@tldraw/sync`).
*   **Fonts:** Tích hợp phông chữ sử dụng Native Font Loading API (`document.fonts.load()`).
