# 個人教學資源網 — Authentication System

保留原本 HTML / CSS / JavaScript、數位邏輯 8 章及電子學 11 章版型。公開 HTML 不再包含章節教材全文、題庫答案或受保護 PDF / 圖片。

目前為開發分支，正式 Firebase 設定尚未填入。主站必須等 Firebase 部署、44 個資源上傳及正式環境驗證後才切換。詳見 [現況與計畫](docs/implementation-plan.md)、[Firebase 設定與上線](docs/firebase-setup.md)、[測試紀錄](docs/testing.md)。

## Architecture

GitHub 管理程式碼與公開頁面；Firebase Authentication 驗證 Email / 密碼；Firestore 保存 users / courses / resources；Cloud Storage 保存受保護 HTML 片段、PDF 及圖片；Firestore / Storage Rules 每次讀取檢查 UID、active、role、courses、visibility；Cloud Functions 使用 Admin SDK 執行教師管理。

學生不提供公開註冊介面。即使有人繞過 UI 自行呼叫 Firebase Auth 註冊，也因沒有受信任 users 文件而無法讀取教材。教師及管理員不可由前端建立或提升角色。

## Files

- login.html：Email 登入、LOCAL / SESSION persistence、忘記密碼。
- dashboard/index.html：依授權課程顯示卡片。
- admin/index.html：新增、編輯、啟停學生、課程授權、重設登入權限。
- account.html：重新驗證目前密碼後變更密碼。
- resource.html：使用 getBlob 讀取 PDF，再建立本機 blob URL。
- courses/.../chapter.../：沿用原標題及 CSS；只有空白教材容器，登入後載入受保護 HTML。
- js/：firebase-config / firebase / auth / auth-guard / permissions / dashboard / admin / lesson / resources / catalog。
- functions/：createStudent、updateStudent、resetStudentAccess；教師認證、輸入驗證、操作鎖、頻率限制、審計紀錄。
- firestore.rules / storage.rules：預設拒絕、學生不可寫入權限、教師瀏覽器也不能直接修改角色。
- data/resource-manifest.json：44 個移轉資源的中繼資料與雜湊；不含教材本文。
- migration-private/：本機原始教材與 Storage 上傳資料，gitignored，禁止放入公開 Repository 或網站。
- scripts/：受信任的移轉、上傳、首位教師及 emulator 工具；公開網站建置排除 scripts / functions。

## Firestore schema

users/{uid}: uid, name, studentId, className, email, role (student / teacher / admin), active (boolean), courses (course ID array), authValidAfter (seconds), createdAt, updatedAt。

courses/{courseId}: title, description, active, chapterCount。第一版為 digital-logic / electronics-2；新增課程只增加文件與網站內容，不須改登入核心。

resources/{resourceId}: courseId, chapterId, type (lesson / quiz / pdf / image), title, visibility (student / teacher), active, storagePath, filename, originalPath, sha256, size。

auditLog/{id}: actor, target, action, createdAt。managementLimits/{teacherUid}: start, count。皆禁止瀏覽器讀寫。短期 provisioning / managementOperation 用來防止跨 Auth / Firestore 操作競爭，失敗維持停用。

Firestore 無明文密碼。授權欄位僅由可信任後端及管理腳本修改。

## Storage paths

protected/{courseId}/{resourceId}/{filename}

例如 protected/electronics-2/electronics-2-chapter10-lesson/content.html。路徑、resource 文件及檔名必须完全一致。Rules 只讀取 users 與 resources 兩個 Firestore 文件，符合 Storage Rules 的跨服務文件上限。

所有受保護檔案都以 SDK getBlob / getBytes 驗證讀取，不使用永久 token URL / getDownloadURL。上傳工具拒絕 public IAM / ACL，刪除 firebaseStorageDownloadTokens，並設定 private, no-store。CORS 允許網站來源不等於授權，資料仍由 Rules 判斷。

停用個別資源設 resources.active=false；若要停用整門課程，須同時停用該課所有 resources，不能只隱藏 courses.active。已下載至使用者電腦的檔案不能被遠端收回。

## Teacher / Student permissions

| 操作 | Teacher / Admin (active) | Student (active) | Disabled / 無 profile |
| --- | --- | --- | --- |
| 課程 | 全部 | 授權科目 | 拒絕 |
| 學生版教材 / 題庫 / PDF | 全部 | 授權科目且 resource active | 拒絕 |
| 教師版教材 | 允許 | 拒絕 | 拒絕 |
| 學生資料 | 全部 | 僅自己文件 | 僅自己狀態 |
| 新增 / 編輯 / 啟停學生 | 透過 Functions | 拒絕 | 拒絕 |
| 修改 role | Console / 可信任管理員 | 拒絕 | 拒絕 |

## Firebase configuration

在 js/firebase-config.js 放入 Firebase Console Web App 的 client config，並保持 useEmulators=false。Client config 是公開設定；不放 Private Key、服務帳戶金鑰或任何學生／教師密碼。Functions 區域為 asia-east1；更改區域時前後端一起修改。

可信任腳本環境：FIREBASE_PROJECT_ID、FIREBASE_STORAGE_BUCKET；透過 Application Default Credentials 取得伺服器身分，可使用 gcloud auth application-default login。需要服務帳戶時，GOOGLE_APPLICATION_CREDENTIALS 必須指向 Repository 外的檔案，切勿上傳。不要把環境值中的祕密寫入 README 或 commit。

正式 Firebase Console 設定、Email / Password 啟用、授權網域、密碼政策、Rules 與首位 Teacher 步驟詳見 docs/firebase-setup.md。

## Development and testing

使用 Node.js 22、pnpm 11、Java 21 執行 Firebase emulator。

    pnpm install --frozen-lockfile --ignore-scripts
    pnpm --dir functions install --frozen-lockfile --ignore-scripts
    pnpm run test:unit
    pnpm run test:rules
    pnpm run test:functions
    pnpm run build:site
    pnpm run serve

本機網址 http://127.0.0.1:4173/；不是正式安全系統的上線網址。不要直接 file:// 開啟模組頁面。

測試帳號僅建立在 demo-teaching-auth emulator。scripts/seed-emulator.mjs 每次產生隨機密碼；production 不建立測試帳號，也不推送密碼。可在本機示範前執行該腳本，再只在本機建置輸出 site/js/firebase-config.js 使用 emulator 設定。

CI workflow 在開發分支或 PR 執行程式、Rules、Functions 測試，不部署主站。正式安全測試及 Chrome / Edge / iPhone Safari / Android Chrome 真機測試仍須在實際 Firebase 設定後完成。

## Resource migration and deployment

1. 原始教材已保留於本機 migration-private/，而非公開 GitHub 分支。取得交付的私人教材包，解壓後讓 migration-private/ 位於專案根目錄。
2. 程式碼 checkout 使用 feature/auth-system。
3. 設定 Firebase Console 與 client config，部署 Rules / Functions。
4. node scripts/upload-resources.mjs 先驗證；確定專案 / bucket 後加 --apply 上傳。此工具需要 ADC，沒有服務帳戶祕密寫入前端。
5. 建立首位教師，執行正式環境驗證。
6. 建立乾淨 site/，可用 Firebase Hosting 預覽頻道測試後發布，或將受控公开檔案更新至 GitHub Pages。

若沿用 GitHub Pages 根目錄部署，切換時必須確認沒有 migration-private/、PDF / 教材圖片及旧全文。建議改為使用乾淨 site/ 的發布流程。不能將整個工作資料夾上傳為網站。

## Existing public history

原 Repository / main / Git 歷史已有公開教材。新 Rules 不能保護 GitHub 中的舊副本，也不能撤回外部下載或快取。正式保護的完成条件包含另行處理公開 Repository 的教材歷史與 Pages 舊部署來源；需備份後由擁有者決定私人保留與公開歷史處理方案。本次不改寫 main 歷史。

