# Firebase Console 與正式上線步驟

此文件給網站擁有者執行；開發程式未替你登入、建立 Firebase 專案、綁定信用卡或猜測設定。

1. 在 https://console.firebase.google.com/ 使用自己的 Google 帳號建立或選定專案。
2. 依現行要求，Cloud Storage 與部署 Cloud Functions 需要 Blaze。由本人確認帳務及使用額度；設定預算提醒。官方資料：[Storage 帳務要求](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)、[Functions 開始使用](https://firebase.google.com/docs/functions/get-started)。
3. 建立 Web App，把 Client Config 貼到 js/firebase-config.js 的 firebaseConfig。保持 useEmulators=false。這份設定不是 Admin SDK 金鑰，不需提供 Google 密碼。
4. Authentication → Sign-in method → 啟用 Email / Password。第一版不要啟用其他登入來源。開啟 Email enumeration protection，密碼政策至少 12 字元，於模板設定繁體中文密碼重設信件。
5. Authentication → Settings → Authorized domains 加入 leujl.github.io 與你實際預覽使用的網域。正式環境不必加入 localhost；本機用 emulator。
6. Firestore 建立 Standard edition 的 (default) 資料庫，選擇適當地區；Storage 建立 bucket，記下實際名稱（新 bucket 通常結尾 .firebasestorage.app）。不要以測試模式保持全開 Rules。
7. 安裝專案依賴，使用本人 Firebase CLI 登入：pnpm exec firebase login；指定實際 project：pnpm exec firebase use PROJECT_ID。
8. 部署限制規則與管理 Functions：pnpm exec firebase deploy --project PROJECT_ID --only firestore:rules,firestore:indexes,storage,functions。Storage Rules 使用 Firestore get，首次部署可能要求啟用跨服務 IAM，依 Firebase 官方提示設定。
9. 使用自己的 gcloud Application Default Credentials 設定 bucket CORS：gcloud storage buckets update gs://BUCKET_NAME --cors-file=cors.json；新增的預覽來源也要放入 CORS。bucket 不可有 allUsers / allAuthenticatedUsers 公開 IAM 或公開 object ACL。
10. 把私人教材包解壓到專案 migration-private/。在 PowerShell 設定環境：

        $env:FIREBASE_PROJECT_ID = '你的實際 project ID'
        $env:FIREBASE_STORAGE_BUCKET = '你的實際 bucket 名稱'
        gcloud auth application-default login
        node scripts/upload-resources.mjs
        node scripts/upload-resources.mjs --apply

    第一次命令僅核對檔案與 SHA256；第二次才上傳並建立 courses / resources。需要具備 Storage / Firestore / bucket IAM 讀取管理權限。
11. 首位教師：在 Authentication Console 新增 Email / Password 使用者，由本人決定密碼；複製 UID。可用 node scripts/first-teacher.mjs AUTH_UID，或在 Console 的 users/{uid} 填 uid、name、email、role=teacher、active=true、courses=[]、studentId=''、className=''、authValidAfter=0、createdAt=timestamp。不要在文件填 password。腳本只允許首次建立，拒絕在已有老師時靜默新增。
12. 建立預覽：pnpm run build:site；可使用 pnpm exec firebase hosting:channel:deploy auth-preview --project PROJECT_ID，將其實際 HTTPS 網域加入 Authorized domains / CORS。預覽時確認 Storage、Functions 和 Firestore 的 Rules / IAM 都已部署。
13. 教師登入後建立兩個學生測試帳號：A 只授權 digital-logic，B 授權兩科；以本人決定的密碼交付，勿在 GitHub 留存密碼。正式測試後由教師停用測試帳號。
14. 完成 docs/testing.md 中的正式環境與真機驗收後，再合併／切換 Pages。不要在 Firebase 未設定或教材未上傳時直接發布空版型替換主站。
15. 處理原公開 main、Git 歷史與舊 Pages 部署的教材副本；需另外備份及規劃私人保存。只刪除目前工作樹檔案，不能使歷史內容失去公開可讀性。本次尚未改寫公開歷史。

## 管理與維護

新增學生：登入 admin/ → 填學生資料與初始密碼 → 勾課程 → 儲存。後端固定 role=student，前端無法建立 Teacher。

停用／啟用：學生列表按鈕會透過 backend 同步 Auth.disabled 與 users.active，並撤銷 refresh tokens。重新啟用後由學生重新登入。

重設登入權限：會撤銷原有登入並產生密碼重設連結，由老師私下交给該學生。連結只顯示在當前頁，不写入資料庫或日誌。學生自助忘記密碼則由 Firebase 寄信。

角色管理只在可信任 Console / Admin Script 進行。需新增課程時，新增 courses 文件、對應課程頁及 resources；學生授權從 Teacher 後台選取。

resource.visibility=teacher 保護教師版；學生版题庫含原本答案解析，符合第一版學生可讀解析的需求。

課程停用請同時將該課 resources.active 設為 false，才能讓 Storage 也拒絕；Storage Rules 每次最多跨讀兩個 Firestore 文件，所以以資源文件及使用者文件為讀取依據。

## 完成前的明確限制

目前沒有 production Project ID / Client Config、已部署 Functions URL、或 production 測試網址。移轉包只是已備妥的本機教材，不代表已上傳 Storage。Cloud Functions emulator 與 Rules emulator 的成功結果不能取代正式 IAM、CORS、信件寄送與跨瀏覽器驗證。


## 每月 US$5 自動暫停
最新版本需先依 docs/budget-control.md 初始化 serviceControl/budget，設定 Cloud Billing topic、預算識別參數及部署 pauseOnBudget，才能使用教材。Storage 資源缺少 budgetPaused=false 時會拒絕存取。更新後的移轉腳本會保留暫停狀態。


