# 現況分析與施工計畫

來源 commit：a44e6a13910b91a280f33403eaf89059781e091a。

- 目前為公開 Repository；main 最新 Pages 動態部署已成功，沒有自訂 workflow 或建置系統，根目錄 .nojekyll。
- 共用 css/style.css，使用 Noto Sans TC / Space Grotesk、藍色與深藍配色，850px / 600px 響應式斷點。
- js/main.js 僅處理手機選單及頁尾年份。
- 數位邏輯 8 章；電子學 11 章，其中第 10 章含兩份原生 details 展開答案的 HTML 題庫。
- downloads/digital-logic 有 13 份 PDF；電子學第 10 章有 5 PNG 及 5 SVG 教材圖片。
- 教材目前直接位於公開 HTML / PDF / 图片檔，登入 UI 無法保護現有檔案。

預計修改 index.html / about.html / courses/index.html 的登入入口；課程首頁加入共用 guard；所有章節及 HTML 題庫改成原版型 shell。downloads.html / quizzes.html 改成依登入權限列出資源。
新增 login.html、dashboard/、admin/、account.html、resource.html、css/auth.css、js/firebase-config.js / firebase.js / auth.js / auth-guard.js / permissions.js / dashboard.js / admin.js / lesson.js / resources.js 等模組、Cloud Functions、Rules、移轉工具及測試。

順序：1. Firebase / Rules 基礎；2. 登入、Dashboard；3. guard 及角色；4. 教師後台；5. 保護教材；6. PDF / 圖片移轉工具；7. 安全測試；8. 設定 Firebase、上傳教材、驗證後才切換正式站。

施工僅在 feature/auth-system。保留原始教材於本機 gitignored migration-private/，不得推到公開分支。移轉後的 PDF / 圖片會從開發分支的公開目錄移除；main 保持現況直到驗證完成。

限制：目前及歷史版本已公開的內容仍可從 main、Git 歷史或外部快取取得。新登入系統只能保護搬移後的受控資料；需另將教材歷史移至私人保存並處理公開來源，不能宣稱舊內容已收回。不要在未備份及未審核影響前改寫 Git 歷史。

