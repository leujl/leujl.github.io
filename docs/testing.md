# 測試結果與驗收狀態

測試日期：2026-10-02（Asia/Taipei）。基準 source commit：a44e6a13910b91a280f33403eaf89059781e091a。

## 已完成

| 測試層 | 結果 | 範圍 |
| --- | --- | --- |
| 程式／靜態建置測試 | 7/7 通過 | 權限判斷、後端驗證、21 個空白教材 shell、公開建置排除教材與後端、連結有效、資源 ID 不重複 |
| Firestore／Storage Rules emulator | 13/13 通過 | 8 項指定安全情境，加上 path mismatch、禁止 upload、撤銷課程、舊 auth_time、inactive resource、受限制 query |
| Cloud Functions emulator | 4/4 通過 | 未登入／學生拒絕、教師新增與去重、角色提升拒絕、授權／啟停／重設 |
| 模組語法 | 通過 | js、functions、scripts、tests 的 node --check |
| 瀏覽器本機示範 | 通過以下操作 | Codex 內建瀏覽器，使用 emulator 專案；非 production |

實際瀏覽器操作：

- Firebase 未設定時登入按鈕停用，教材仍為空白。
- 未登入直接進电子學第 10 章會導向 login。
- Student A 登入只看到數位邏輯；跨電子學網址被導回 Dashboard。
- Student B 登入看到兩科；登入後電子學教材可以載入。
- 數位邏輯第 1 章從 Storage 載入，原有章節／TOC 版型保留。
- PDF 開啟連結為本機 blob URL，沒有永久 Firebase token URL。
- 電子學五張 PNG 都完整載入，來源均為經驗證取得的 blob。
- 電子學 10-1 題庫可展開原有答案／解析。
- Student B 無法進入 admin；Teacher 可以看到學生管理表格。
- 390×844 手機尺寸登入頁無橫向溢出，Dashboard 單欄；Admin table 可橫向捲動，頁面無橫向溢出。
- 保持登入使用 LOCAL；未勾選使用 SESSION。內建瀏覽器 viewport 重建時曾失去 SESSION；一般導航的 SESSION 測試及 LOCAL 導航成功，但真實瀏覽器持續登入行為仍待驗收。

本機 Node 是 24.19.0，部署設定與 CI 指定 Node 22；Functions emulator 提示使用 host Node 24。Rules emulator 首次 CLI 結束因全域 update notifier 寫入限制返回非零；在工作區 config 路徑下直接重新執行 13 項 Rules 測試已退出 0。測試本身無失敗。

## 尚未完成的正式驗收

- 目前沒有 production Firebase Client Config、已部署的 Rules／Functions／IAM 或已上傳的受保護 bucket。
- 密碼重設寄信、production CORS／bucket IAM／App domain、Firebase 帳務與 Console 步驟未驗證。
- Windows Chrome、Windows Edge、iPhone Safari、Android Chrome 真機驗收未完成；本次可用的 UI 環境只有內建瀏覽器，不能將 viewport 模擬稱作真機測試。
- 公開 Repository main、Git 歷史與舊 Pages 版本已有教材；尚未處理公開歷史，不能宣稱現有所有舊教材已無法公開讀取。
- 課程整體停用必須一併停用 resources.active；已下載內容無法收回。

## 正式環境必跑清單

1. 未登入直接開各科章節、題庫、Storage PDF：不得讀到全文或檔案。
2. Student A 對 electronics-2 的直接 SDK／REST 讀取：拒絕，即使刪除 guard 也不得讀。
3. Student 讀取他人 users、提升 role、改 active／courses、列出學生：拒絕。
4. Student 存取 teacher visibility：拒絕；Teacher 可讀。
5. Teacher 建立、編輯、啟停帳號、重設權限：成功且不寫入 password。
6. 已登入學生被停用／移除科目時，Rules 立即拒絕新的讀取；前端清空內容並要求重新登入。
7. 重設權限後舊 ID token 因 authValidAfter 被拒絕；新登入可按新授權讀取。
8. 四種指定瀏覽器的登入、LOCAL／SESSION、忘記密碼、手機選單、PDF 開啟與表格捲動。
9. 使用公開 URLs 掃描 root、歷史來源與舊部署，確認正式遷移後仍沒有可繞過 Firebase 的教材副本。

## 測試網址

本機：http://127.0.0.1:4173/（僅程式開發預覽，預設 production config 留空）。
原主站：https://leujl.github.io/（main 未變動，尚未具備本次保護）。
正式 Firebase／HTTPS 驗證網址：尚未建立。由擁有者設定專案後建立 Firebase Hosting preview channel。

## USD5 budget pause verification
The updated suite contains 11 unit/static tests, 15 Rules emulator tests and 6 backend emulator tests. Budget checks cover under-limit, wrong identity/currency, stale messages, Pacific month boundaries, atomic/idempotent locking, direct student/teacher PDF denial and trusted next-month recovery. Real Cloud Billing Pub/Sub delivery, production IAM and the live frontend pause notification still require deployment verification. No production budget protection has been enabled by these tests.

