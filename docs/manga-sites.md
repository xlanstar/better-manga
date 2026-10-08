# 漫畫網站網址

追蹤已支援、未支援與相關的漫畫網站網址（含同一站的所有網域）。
只記錄網站與網域；技術細節（前端差異、廣告、選擇器、為什麼某些網域不涵蓋）寫在
`src/sites/<name>.ts` 的註解裡。`matches` 以程式碼為準，不一致時回頭修正本文件。

最後查證：2026-10-09。狀態是從開發機用 `curl` 開首頁的結果，會因地區與網路而不同。

狀態標記：

- `ok`：可連線（200，或轉址到同站）
- `cf`：Cloudflare 驗證頁（403 challenge，瀏覽器裡通常正常）
- `dead`：無法連線、停放頁或已關站
- `unverified`：只在第三方來源看到，未實際檢查
- `→ X`：轉址到 X

已支援的網域另外標 `matched`（已被 `matches` 涵蓋）或 `unmatched`。

這類網站常換網域，各站「發布頁」通常是最新網域的最可靠來源。

## 已支援

### GoDa 漫畫網（site files: `baozimh`、`g-mh`、`18mh`）

同一個營運者，分成多個前端，各自一個 site file。

包子漫畫（`baozimh`，標示為「包子漫畫（baozimh.org）」）：

- `baozimh.org`、`m.baozimh.org`：ok；matched
- `www.baozimh.org`：→ `baozimh.org`；matched
- `bzmh.org`、`www.bzmh.org`、`m.bzmh.org`：ok；matched
- `m.baozimh.one`（Bun漫畫）：ok；matched

G站漫畫（`g-mh`）：

- `g-mh.org`、`m.g-mh.org`（G社漫畫）：ok；matched
- `godamh.com`：ok；matched
- `www.g-mh.org`：→ `g-mh.org`；unmatched
- `www.godamh.com`：→ `godamh.com`；unmatched

18漫畫（`18mh`，R18）：

- `18mh.org`：cf；matched（含所有子網域，未實測）

相關網域：

- 發布頁：`n.telltome.net`、`des.telltome.net`（免廣告說明）
- 同營運者的其他網站：
  - `manhuascans.org`：英文版
  - `m.godamh.com`：G社資訊（新聞站）
  - `baozimh.one`：Bun社（新聞站）

### 嬉皮漫畫（site file: `hipmh`）

- `reader.hipmh.top`：閱讀器；matched
- `m.hipmh.com`：主站；ok；unmatched
- `hipmh.com`：嬉皮社入口；ok；unmatched
- `m.xipmh.com`：HippaMark 書籤庫；ok；unmatched

不要和「嗨皮漫畫」（`happymh.com`，已關站）混淆。

### 包子漫畫，baozimh.com 系（site file: `baozimh-com`）

原本的包子漫畫，和 GoDa 的「包子漫畫」是不同網站；標示為「包子漫畫（baozimh.com）」。
各網域含所有子網域都 matched。

- `www.baozimh.com`、`cn.baozimh.com`：網站自己的 JS 驗證頁（瀏覽器正常）
- `tw.baozimh.com`：cf
- `appcn.baozimh.com`、`appgb.baozimh.com`：cf；App 用（只有 nginx 預設頁）
- `www.webmota.com`、`cn.webmota.com`、`tw.webmota.com`：ok
- `www.kukuc.co`、`cn.kukuc.co`、`tw.kukuc.co`：ok
- `www.twmanga.com`、`cn.twmanga.com`、`tw.twmanga.com`：ok
- `www.dinnerku.com`、`cn.dinnerku.com`、`tw.dinnerku.com`：ok
- `baozimh.com`、`webmota.com`、`kukuc.co`、`twmanga.com`、`dinnerku.com`：→ `www.`
- `www.twbzmg.com`、`cn.twbzmg.com`、`tw.twbzmg.com`：ok；章節連結轉到這裡（`twbzmg.com` 未實測）
- `baozimh.vip`：cf（瀏覽器也過不了，未確認是同一站）；只在搜尋結果出現過

### 拷貝漫畫（site file: `copymanga`）

各網域含 `www.` 都 matched（不帶 `www` 的版本內容相同）；網域常換。

- `www.mangacopy.com`、`mangacopy.com`：ok
- `copy20.com`、`2026copy.com`、`copy3000.com`、`copy4000.com`、`copy5000.com`（含 `www.`）：ok；
  網站標示 `www.copy4000.com` 給中國大陸
- `www.2025copy.com`：dead（停放頁）
- `copymanga.com`、`copymanga.org`、`www.copymanga.tv`、`www.copy-manga.com`：dead（舊網域）
- 注意：網路上有不少仿冒的「最新網址」文章

### 熱辣漫畫（site file: `relamanhua`，R18）

拷貝姊妹站。各網域含 `www.`、`m.`（手機版）都 matched。

- `manga2024.com`、`2024manga.com`、`manga2025.com`、`manga2026.xyz`（含 `www.`）：ok
- `www.relamanhua.org`、`relamanhua.com`：dead（憑證不受信任）；`relamanhua.org`：dead（停放頁）

### 漫畫櫃／看漫畫（site file: `manhuagui`）

- `www.manhuagui.com`、`tw.manhuagui.com`、`m.manhuagui.com`：ok；matched
- `manhuagui.com`：→ `www.manhuagui.com`；unmatched
- `www.mhgui.com`、`m.mhgui.com`、`mhgui.com`：→ `www.manhuagui.com`；unmatched
- `cf.mhgui.com`：靜態檔；unmatched
- `tw.mhgui.com`：dead

### 再漫畫（site file: `zaimanhua`）

一般認為是動漫之家的後繼。

- `manhua.zaimanhua.com`、`www.zaimanhua.com`、`zaimanhua.com`、`m.zaimanhua.com`：ok；matched
- `i.`、`news.`、`nbbs.`、`static.`、`images.zaimanhua.com`：其他服務；unmatched
- 動漫之家舊網域 `www.dmzj.com`、`manhua.dmzj.com`、`www.idmzj.com`：dead

### 動漫屋系（site files: `dm5`、`1kkk`、`manhuaren`、`manben`）

動漫屋（`dm5`）：

- `www.dm5.com`、`m.dm5.com`、`tel.dm5.com`、`en.dm5.com`、`cnc.dm5.com`：ok；matched（含所有子網域）
- `www.dm5.cn`：ok；matched
- `dm5.com`、`dm5.cn`：→ `www.`
- `m.dm5.cn`：403；unmatched

極速漫畫（`1kkk`）：

- `www.1kkk.com`、`m.1kkk.com`：ok；matched（含所有子網域）
- `1kkk.com`：→ `www.1kkk.com`

漫畫人（`manhuaren`）：

- `www.manhuaren.com`、`manhuaren.com`：ok；matched（含所有子網域）

漫本（`manben`，同後端、自己的前端）：

- `www.manben.com`：ok；matched
- `manben.com`：→ `www.manben.com`

### Mangabz 系（site files: `mangabz`、`xmanhua`、`yymanhua`）

各網域含所有子網域都 matched。

- `mangabz.com`、`www.mangabz.com`：ok
- `www.xmanhua.com`、`xmanhua.com`：ok
- `www.yymanhua.com`、`yymanhua.com`：ok

### Komiic（site file: `komiic`）

- `komiic.com`、`komiic.cc`、`www.komiic.cc`：cf；matched（需登入才能看）
- `www.komiic.com`：404；unmatched

### 無限動漫（site file: `8comic`）

- `www.8comic.com`：ok；matched
- `8comic.com`、`www.comicabc.com`、`www.comicbus.com`：→ `www.8comic.com`
- `articles.onemoreplace.tw`：閱讀頁；只 match `/online/*`（其他路徑是桌遊部落格）
- `8.twobili.com`、`a.twobili.com`：dead（舊閱讀頁）

### COLAMANGA（site file: `colamanga`）

- `www.yoyomanga.com`：首頁 ok，其他頁面 Cloudflare 522／523；matched
- `www.colamanga.com`、`colamanga.com`：→ `www.yoyomanga.com`
- `yoyomanga.com`：523；unmatched
- 發布頁：`acloudmerge.com`（集雲數據）

### 漫蛙（site file: `manwa`）

各網域含所有子網域都 matched。

- `manwa.me`：cf（台灣通過驗證後 404）
- 備用：`manward.cc`、`manwarp.cc`、`manwaro.cc`、`manwarj.cc`（台灣 404，靜態檔與 `manwa.me` 相同）
- `mwmissing11.cc`（走失頁）、`fuwbn.cc`（轉址到備用網域）、`manwaxzba.cc`（APP）：ok；unmatched
- 舊鏡像：`fuwt.cc`：dead；`manwass.cc`、`manwatg.cc`：不是本站；`manwast.cc`、`manwasy.cc`：停放頁

### 喜漫漫畫（site file: `favcomic`）

各網域含所有子網域都 matched。

- `www.favcomic.com`、`m.favcomic.com`：ok
- `www.favcomic.xyz`、`www.favcomic.net`、`www.favcomic.cc`：ok
- `favcomic.com`、`favcomic.xyz`、`favcomic.net`、`favcomic.cc`：→ `www.`

### 漫畫狗（site file: `dogemanga`）

- `dogemanga.com`：ok；matched
- `www.dogemanga.com`：→ `dogemanga.com`；unmatched

### 漫畫1234（site file: `wmh1234`）

- `m.wmh1234.com`、`www.wmh1234.com`：ok；matched
- `wmh1234.com`：→ `m.wmh1234.com`
- `reader.hqread.cc`：閱讀頁；matched

### 漫畫160（site file: `mh160mh`）

- `www.mh160mh.com`、`m.mh160mh.com`：ok；matched
- `mh160mh.com`：→ `www.mh160.cc`（cf，未確認是同一站）；unmatched

### 嗶哩漫畫（site file: `bilimanga`）

- `www.bilimanga.net`：ok；matched
- `bilimanga.net`：→ `www.bilimanga.net`
- `www.bilicomic.net`（簡體版）：→ `www.bilimanga.net`；unmatched

### 古風漫畫（site file: `gfmh`）

- `gfmh.app`、`www.gfmh.app`：ok；matched
- 舊站 `www.gufengmh.com`：dead

### 其他單一網站

- 瓜子漫畫（`guazimanhua`）：`www.guazimanhua.com`；ok；matched（`guazimanhua.com` → `www.`）
- 六漫畫（`liumanhua`）：`www.liumanhua.com`、`m.liumanhua.com`；ok；matched
- MYCOMIC（`mycomic`）：`mycomic.com`；cf；matched
- vomic漫（`vomicmh`）：`www.vomicmh.com`、`vomicmh.com`；ok；matched（需登入才能看）
- 優酷漫畫（`ykmh`）：`www.ykmh.net`、`m.ykmh.net`；ok；matched
- 漫畫屋（`mhua5`）：`www.mhua5.com`、`mhua5.com`；ok；matched
- 妙趣漫畫（`miaoqumh`）：`www.miaoqumh.org`、`m.miaoqumh.org`；ok；matched
- 92漫畫（`92mh`）：`www.92mh.com`；cf；matched（`m.92mh.com`：dead）
- CManhua（`cmanhua`）：`cmanhua.com`；ok；matched（`www.cmanhua.com`：IIS 預設頁）

### R18

- 禁漫天堂（`18comic`）：
  - `18comic.vip`、`jmcomic-zzz.one`、`jmcomic-zzz.org`：cf；matched
  - `18comic.ink`：ok；matched
  - `18comic.org`、`comic18j-ada.online`、`comic18j-ada.space`、`comic18j-ada.work`：→ `18comic.vip`
  - `18comic-ive.club`、`18comic-aspa.org`、`18comic-wantgo.cc`：dead
  - 發布頁：`jmcomic6.org`（→ `jmcomictt.site`）
- 紳士漫畫（`wnacg`）：
  - `www.wnacg.com`、`www.wnacg.ru`（頁尾標示的主網域）：ok；matched
  - 目前的鏡像：`www.wn001.cfd`、`www.wn002.cfd`：ok；matched
  - 不帶 `www` 的版本、`m.wnacg.com`：→ `www.`
  - 舊鏡像：`wn06`、`wn07`、`wn10` 的 `.cfd`、`.shop`
  - 發布頁：`wnacg01.link`、`wnacg02.link`
- NoyAcg（`noyacg`）：`noymanga.com`、`www.noymanga.com`；ok；matched（需登入才能看）。
  `noy1.top`：轉址到 `noymanga.com`
- hanime1（`hanime1`）：`hanime1.me`（影片）：cf；`hanimeone.me`（含漫畫）：ok；matched
- 肉漫屋（`roumanwu`）：`rouman5.com`、`roum29.xyz`；ok；matched；發布頁 `rou.pub`
- 18漫畫：見 GoDa 漫畫網

## 未支援

### 已關站或失效

- 嗨皮漫畫：`www.happymh.com`、`m.happymh.com`；dead；2026-08-14 宣布永久關站
- 動漫狂：`www.cartoonmad.com`、`cartoonmad.cc`；dead（停放頁）
- 新新漫畫：`www.77mh.com`；dead
- 漫畫堆：`www.manhuadui.com`；dead（停放頁）
- 讀漫屋：`m.dumanwu1.com`；dead
- 如漫畫：`m.rumanhua2.com`；dead

### 正版平台（列出避免誤加）

- 騰訊動漫：`ac.qq.com`
- 嗶哩嗶哩漫畫：`manga.bilibili.com`
- 快看漫畫：`www.kuaikanmanhua.com`
- 咚漫：`www.dongmanmanhua.cn`
- LINE WEBTOON：`www.webtoons.com`
- CCC 追漫台：`www.creative-comic.tw`
- 東立：`ebook.tongli.com.tw`
- TOPTOON：`www.toptoon.net`
- 泰拉記事社：`comic.hypergryph.com`

## 資料來源

- keiyoushi/extensions-source：`src/zh/*/build.gradle.kts` 裡的 `mirrors`（包子漫畫、GoDa、漫畫櫃、Mangabz、漫蛙、喜漫等）
  — https://github.com/keiyoushi/extensions-source
- hymbz/ComicReadScript：`src/index.ts` 與建置後的 `ComicRead.user.js`（拷貝、熱辣、dm5、8comic、wnacg）
  — https://github.com/hymbz/ComicReadScript
- Aidoku 拷貝漫畫 source.json
  — https://cdn.jsdelivr.net/gh/Aidoku-Community/sources@main/sources/zh.copymanga/res/source.json
- 漫流閱讀器的 `@match`（包子、嬉皮、GoDa、8comic）— https://greasyfork.org/scripts/573753
- 發布頁：`n.telltome.net`、`jmcomic6.org`、`wnacg01.link`、`stevenyomi.github.io/source-domains/wnacg.txt`
- 嗨皮漫畫關站：NOWnews 2026-08-15 — https://www.nownews.com/news/6866090

## 新增或變更網址時

1. 修改 `src/sites/<name>.ts` 的 `matches`（新網站還要在 `src/sites/index.ts` 登記）。
2. 更新本文件。
3. 同步 `store/chrome-web-store.md` 的主機權限說明（`PRIVACY.md` 只連結本文件，不列網站）。
   R18 網站不寫進任何上架資料（商店說明、截圖、`scripts/screenshots/`）。
4. 依 semver 更新 `package.json` 版本（新網站 → minor）。
