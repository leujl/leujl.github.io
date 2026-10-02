# 每月 US$5 自動暫停教材：程式與設定

本功能已寫好，但尚未在正式 Firebase 部署，也尚未連接 Cloud Billing 預算。只有全部設定與正式驗收完成後才生效。預算快訊不是硬性收費上限；帳務資料與通知有延遲，仍可能超過 US$5。資料儲存、後台、通知與已開始的傳輸仍可能產生費用。GitHub Pages 公開首頁不會因此關閉。

## 行為

收到指定帳單帳戶、指定 budget ID 的當月 USD5 預算通知，且「實際 costAmount >= 5」時，pauseOnBudget 在 Firestore 單一交易中把 serviceControl/budget.paused 設為 true，並把每個 resources 文件的 budgetPaused 設為 true。重複通知不重寫；預測超支、其他預算、非 USD、錯誤格式、前月遲到通知均不觸發。

Firestore 阻止所有角色讀教材資源；Storage 同時阻止學生和老師下載，包括教師版。使用者文件、課程清單與教師管理功能保留。頁面收到即時狀態後清除已載入內容並顯示「本月教材服務因預算限制暫停，請洽老師。」已下載到學生裝置的檔案無法收回，也不能保證立刻中斷已開始的下載。

Storage Rules 只跨讀 user 與 resource 兩個 Firestore 文件，避免超過官方跨服務讀取限制；因此資源的 budgetPaused 與全域暫停狀態以同一交易更新。現階段最多 450 個 resource 文件；超過時處理程式會報錯，必須先擴充架構才能繼續保證整批暫停。目前教材只有 44 個。新增教材必須使用更新後的 upload-resources.mjs，不能手動把 budgetPaused 改為 false。缺少預算狀態的教材下載預設拒絕。

## 由專案擁有者完成的設定

1. 確認選到 **teachhub-1361**，不是其他 Google Cloud 專案。Blaze 綁定帳務由本人操作；程式不需要信用卡資料或 Google 密碼。
2. 在 Cloud Billing「預算與快訊」建立每月固定金額 **USD 5** 預算，名稱可用 TeachHub monthly USD5。範圍只選 teachhub-1361，涵蓋全部服務，不要只監控 Storage。設定 50%、80%、100% 實際費用 Email 提醒，便於本人查看。不要用預測金額當停用依據。
3. 建議監控「抵免前」費用：預算的 credits treatment 選排除所有抵免（EXCLUDE_ALL_CREDITS），避免試用抵免讓成本門檻永遠不觸發。確認預算 currencyCode 是 USD、budgetAmount 是 5、budgetAmountType 是 SPECIFIED_AMOUNT。如果帳戶使用 TWD 而畫面不能建立 USD 預算，先停止此設定；需要確認台幣門檻並修改驗證邏輯，不能直接把 TWD5 當 US$5。
4. 在 teachhub-1361 建立 Pub/Sub topic **teaching-budget-alerts**。預算「管理通知／連接 Pub/Sub 主題」選這個 topic。不要授予 allUsers 或 allAuthenticatedUsers 發布權限。依官方流程只授予 Cloud Billing 通知服務必要的發布權；額外 IAM 授權需由擁有者確認。
5. 記下該預算 budget ID 與 billing account ID。可從通知 attributes 或 Cloud Billing Budgets API 查看；只有名稱不足以识別。將 functions/.env.example 複製為 functions/.env.teachhub-1361，填 BUDGET_ID、BUDGET_BILLING_ACCOUNT_ID；此檔被 gitignore 排除，不需公開。這兩個 ID 不是密碼，但不必貼到公開 GitHub。
6. 使用本人 ADC 登入，初始化未暫停狀態（只可首次執行；不會覆蓋已有暫停）：

```powershell
$env:FIREBASE_PROJECT_ID = 'teachhub-1361'
gcloud auth application-default login
node scripts/budget-service.mjs initialize
node scripts/budget-service.mjs initialize --apply
```

7. 用更新後腳本上傳教材。既有資源初始化時會加上 budgetPaused=false，之後每次上傳會在交易中讀取全域暫停狀態；若服務已停，新教材也保持停用。
8. 部署 Firestore / Storage Rules、Functions 與前端，所有項目都必須更新，不能只更新前端：

```powershell
pnpm exec firebase deploy --project teachhub-1361 --only firestore:rules,firestore:indexes,storage,functions
pnpm run build:site
```

pauseOnBudget 執行帳戶需要 Firestore 的最小必要資料讀寫權限（Cloud Datastore User），由 Eventarc/PubSub 正常觸發；不需要 Billing Admin 或停用帳務權限。此版本不會解除帳單綁定或刪除教材。不可將此函式設定為公開 HTTP callable。不要把管理暫停程式的 topic 發布權限交給學生。

## 驗收

先在獨立測試／emulator 環境發布測試通知，禁止把測試超額消息送到正式 topic：正確 attributes + USD costAmount 5 應鎖住資源；4.99、不同 budgetId、非 USD、前月消息不能鎖住。學生與老師直接讀 PDF 都應被拒絕，學生不可修改 serviceControl 或 budgetPaused。正式部署後另外驗證 Cloud Billing 的真实通知連接與 IAM，並監控 pauseOnBudget 錯誤／資源數上限；emulator 不能驗證帳務發布權限。

可在服務初始化後、正式開放前，透過可信任 Console 在單一交易／管理腳本完成受控暫停測試，勿只修改全域 paused 而忘記每個資源旗標。暫停不會停止儲存費，也不是防止大量拒絕請求造成額外讀取的完整防護。

## 下一個月由老師恢復

本機制不自動恢復。下一個「Google 帳務月份」（America/Los_Angeles 太平洋時間）開始後，由擁有者執行：

```powershell
$env:FIREBASE_PROJECT_ID = 'teachhub-1361'
node scripts/budget-service.mjs resume
node scripts/budget-service.mjs resume --apply
```

同月份恢復會被拒絕，避免明知已超 US$5 仍重新開放。需要提高預算時先另外修改正式預算與程式中的固定門檻，驗收後再設計同月恢復操作；本版本沒有無限制的恢復按鈕。恢復只清除 budgetPaused，不會更動 active、角色、課程授權或教師版 visibility。

## 官方參考

- [預算 Pub/Sub 通知格式與連接](https://docs.cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications)
- [預算範圍與抵免設定](https://docs.cloud.google.com/billing/docs/how-to/budgets)
- [用通知控制資源](https://docs.cloud.google.com/billing/docs/how-to/control-usage)
- [Firebase 預算提醒不會自動停止服務](https://firebase.google.com/docs/projects/billing/budget-alerts)

本程式與文件完成不代表 US$5 保護已啟用。正式啟用仍需 Blaze、topic／budget 連接、參數、初始化、部署與正式驗收。
