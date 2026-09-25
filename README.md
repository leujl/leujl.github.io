# 個人教學資源網 V1.1

這是一套以台灣高中／高職學生為主要使用者的靜態教學網站。網站使用 HTML、CSS、JavaScript 製作，不需要資料庫或後端伺服器，可免費部署到 GitHub Pages。

目前第一門課程是「數位邏輯設計」，依照課本目錄設置 8 個章節入口；第 1、4、5 章已有教學教材與題庫，第 2 章「基本邏輯閘」已有網頁示範內容。

## 網站架構

```text
teaching-website/
├─ index.html                         首頁
├─ downloads.html                     教材下載
├─ quizzes.html                       題庫／測驗
├─ about.html                         關於老師
├─ courses/
│  ├─ index.html                      課程總覽
│  └─ digital-logic/
│     ├─ index.html                   數位邏輯設計課程首頁
│     └─ chapter01/ ～ chapter08/     八個章節頁面（第 2 章為完整示範）
├─ css/style.css                      全站外觀與響應式設計
├─ js/main.js                         手機選單與頁尾年份
├─ assets/icons/favicon.svg           網站圖示
└─ downloads/digital-logic/           PDF 教材資料夾
```

## 最簡單的修改方式

可以使用 Visual Studio Code（免費）開啟整個資料夾。修改前先複製一份備份；修改後在瀏覽器開啟 `index.html` 檢查結果。

### 1. 修改網站名稱

用編輯器的「在檔案中尋找及取代」功能：

1. 尋找：`個人教學資源網`
2. 取代成您的網站名稱
3. 選擇「全部取代」

首頁瀏覽器分頁名稱位於 `index.html` 的 `<title>`；首頁介紹文字也在同一檔案。

### 2. 修改教師資料

開啟 `about.html`，找到下列預留文字後直接取代：

- 請填入教師姓名
- 請填入任教科目
- 請填入教學理念
- 請填入校內或公開聯絡方式
- 請說明建立教學網站的目的

### 3. 修改首頁

開啟根目錄的 `index.html`。首頁分成歡迎區、我的課程、學習路徑三部分。只修改標籤之間的中文文字即可；不熟悉 HTML 時，請不要刪除 `<` 與 `>` 內的內容。

## 新增課程

以下以新增「基本電學」為例：

1. 在 `courses/` 新增 `basic-electricity/` 資料夾。
2. 複製 `courses/digital-logic/index.html` 到新資料夾。
3. 將頁面中的課程名稱、簡介及章節清單改成新課程內容。
4. 在 `courses/index.html` 複製一張 `.course-card` 課程卡片，將連結改成 `basic-electricity/index.html`。
5. 若首頁也要顯示，在 `index.html` 的「我的課程」區加入相同卡片，連結使用 `courses/basic-electricity/index.html`。
6. 在 `downloads/` 新增對應的 `basic-electricity/` 資料夾。

資料夾名稱建議使用小寫英文與連字號，不使用空格，例如 `programming-basics`。

## 調整或新增章節

目前課程固定為 8 章。如日後課程版本確實增加章節，可依下列方式處理：

1. 複製任一尚未填寫的章節資料夾，例如 `chapter04/`。
2. 將複製品改成新章號，例如 `chapter09/`。
3. 開啟其中的 `index.html`，修改章號、章名及各區內容。
4. 到課程首頁複製一張章節卡片，將 `href` 改成新資料夾，例如 `chapter09/index.html`。

所有章節統一包含：學習目標、課程內容、重點整理、教學範例、練習題、教材下載、延伸學習。保留這些區塊，可以讓全站結構一致。

## 修改章節內容

每個章節的內容都在該資料夾的 `index.html`。常用 HTML 寫法：

```html
<h2>大標題</h2>
<h3>小標題</h3>
<p>一段文字。</p>
<ul>
  <li>項目一</li>
  <li>項目二</li>
</ul>
```

完成內容後，可刪除原本的「請填入……」預留區塊。

## 新增 PDF 教材

以第 1 章補充講義為例：

1. 將 PDF 放入 `downloads/digital-logic/`。
2. 建議檔名使用英文、數字與連字號，例如 `ch01-extra-handout.pdf`。
3. 在 `downloads.html` 對應位置，把「準備中」區塊改成下列連結：

```html
<a class="button" href="downloads/digital-logic/ch01-extra-handout.pdf" download>下載 PDF</a>
```

4. 若從第 1 章頁面直接提供下載，因所在層級不同，連結寫法應為：

```html
<a class="button" href="../../../downloads/digital-logic/ch01-extra-handout.pdf" download>下載 PDF</a>
```

沒有檔案時請保留「準備中」，不要先放下載連結，才不會造成失效連結。

## 在電腦上預覽

最簡單的方式是直接雙擊 `index.html`。若安裝 Visual Studio Code，也可安裝 Live Server 擴充套件後，在 `index.html` 按右鍵選擇「Open with Live Server」。

## 從零部署到 GitHub Pages

### A. 建立 GitHub Repository

1. 前往 [GitHub](https://github.com/) 並登入；沒有帳號請先免費註冊。
2. 右上角按「＋」，選擇 **New repository**。
3. Repository name 輸入 `teaching-website`。
4. Visibility 可選 **Public**。GitHub 免費帳號使用 Pages 時，公開儲存庫最直觀。
5. 不必勾選新增 README，按 **Create repository**。

### B. 上傳網站檔案

1. 進入剛建立的 Repository。
2. 選擇 **Add file → Upload files**。
3. 將本專案資料夾「裡面的所有檔案與資料夾」拖入上傳區；不要再多包一層 `teaching-website`。
4. 下方訊息可輸入 `首次上傳教學網站`，按 **Commit changes**。
5. 確認 Repository 首頁最上層可直接看到 `index.html`、`css`、`courses` 等項目。

### C. 開啟 GitHub Pages

1. 在 Repository 上方選擇 **Settings**。
2. 左側選擇 **Pages**。
3. 在 **Build and deployment** 的 Source 選擇 **Deploy from a branch**。
4. Branch 選擇 `main`，資料夾選擇 `/(root)`。
5. 按 **Save**，等待約 1～5 分鐘。
6. 回到 Pages 設定頁，畫面會顯示公開網址，通常是：

```text
https://您的GitHub帳號.github.io/teaching-website/
```

首次發布或大量更新後，GitHub 可能需要幾分鐘才顯示最新內容。

## 日後更新網站

不使用 Git 指令也可以更新：

1. 進入 GitHub Repository。
2. 若只改一個檔案，可開啟該檔案後按鉛筆圖示編輯。
3. 若要更新多個檔案，選擇 **Add file → Upload files**，拖入同路徑的新檔案。
4. 輸入更新說明，例如 `新增第4章教材`，按 **Commit changes**。
5. GitHub Pages 會自動重新發布，不需要再次設定 Branch。

## 設計與維護原則

- 使用相對路徑，可部署在 GitHub Pages 的專案子目錄。
- 所有頁面共用 `css/style.css` 與 `js/main.js`。
- 沒有後端、登入、資料庫或建置程序，降低維護難度。
- 主要內容字級至少 16px，支援鍵盤操作、手機選單與橫向表格捲動。
- V1.1 不包含學生帳號、成績系統或自動計分的線上測驗。

## 授權與隱私提醒

公開前請確認教材、圖片及試題具有合法使用權，也不要把學生姓名、成績、聯絡資料或其他個人資料放入公開 Repository。
