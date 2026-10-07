# 漫畫網站網址

追蹤已支援、候選與相關的漫畫網站網址（含同一站的所有網域）。
`matches` 的唯一來源是 `entrypoints/content/sites/<name>.ts`，這份文件只做追蹤與說明；
兩者不一致時以程式碼為準，並回頭修正本文件。

最後查證：2026-10-07。狀態是從開發機用 `curl` 開首頁的結果，會因地區與網路而不同。

狀態標記：

- `ok`：可連線（200，或轉址到同站）
- `cf`：Cloudflare 驗證頁（403 challenge，瀏覽器裡通常正常）
- `dead`：無法連線、停放頁或已關站
- `unverified`：只在第三方來源看到，未實際檢查
- `→ X`：轉址到 X

已支援的網域另外標 `matched`（已被 `matches` 涵蓋）或 `unmatched`。

這類網站常換網域，各站「發布頁」通常是最新網域的最可靠來源。

## 已支援

### GoDa 漫畫網（site files: `baozimh`、`g-mh`）

同一個營運者、同一套模板：同樣的「收藏永久發布頁」、同一個發布頁、同一個圖片 CDN（`*.6wm.top`）。
keiyoushi 把它們歸成同一個圖源「GoDa漫画」。`baozimh.ts` 和 `g-mh.ts` 其實是針對同一個網站。

閱讀站網域：

- `baozimh.org`：包子漫畫；ok；matched（`*.baozimh.org`）
- `m.baozimh.org`：包子漫畫；ok；matched
- `www.baozimh.org`：→ `baozimh.org`；matched
- `bzmh.org`、`www.bzmh.org`、`m.bzmh.org`：包子漫畫；ok；matched（`*.bzmh.org`）
- `g-mh.org`、`m.g-mh.org`：G社漫畫；ok；matched
- `www.g-mh.org`：→ `g-mh.org`；unmatched（只是轉址）
- `godamh.com`：G站漫畫；ok；unmatched
- `www.godamh.com`：→ `godamh.com`；unmatched
- `m.baozimh.one`：Bun漫畫；ok；unmatched

相關網域：

- 發布頁：`n.telltome.net`（G站漫畫發布頁）、`des.telltome.net`（免廣告說明）
- 同營運者，但不是同一個閱讀站：
  - `18mh.org`：18漫畫，R18，同模板
  - `manhuascans.org`：英文版，同模板
  - `m.godamh.com`：G社資訊（新聞站）
  - `baozimh.one`：Bun社（新聞站）

注意：`g-mh.ts` 的 `label` 是「韓漫窩」，但網站現在的標題是「G社漫畫」。

### 嬉皮漫畫（site file: `hipmh`）

- `reader.hipmh.top`：閱讀器（`/chapter/<hid>`），首頁 → `m.hipmh.com`；matched
- `m.hipmh.com`：主站（目錄、作品頁）；ok；unmatched
- `hipmh.com`：嬉皮社入口與公告；ok；unmatched
- `m.xipmh.com`：HippaMark 書籤庫；ok；unmatched
- API、圖片：`hipapi1.s3file.top`、`cover.s3imgs.top`

說明：

- 章節連結會經過 `m.hipmh.com/chapter/go?hid=…` 跳轉；`hipmh.ts` 會把連結改寫成直接連到
  `reader.hipmh.top/chapter/<hid>`，所以不需要在主站執行。
- 不要和「嗨皮漫畫」（`happymh.com`，已關站）混淆。

## 同名但不同站：包子漫畫（baozimh.com 系）

這是原本的包子漫畫，和上面的 GoDa「包子漫畫」是不同網站（路徑是 `/comic/…`，模板也不同）。**目前未支援。**

- `www.baozimh.com`、`cn.baozimh.com`、`tw.baozimh.com`：cf
- `appcn.baozimh.com`、`appgb.baozimh.com`：app 版頁面（`/baozimhapp`）；cf
- `www.webmota.com`、`cn.webmota.com`、`tw.webmota.com`：ok（只實測 `www`）
- `www.kukuc.co`、`cn.kukuc.co`、`tw.kukuc.co`：ok（只實測 `www`）
- `www.twmanga.com`、`cn.twmanga.com`、`tw.twmanga.com`：ok（只實測 `www`）
- `www.dinnerku.com`、`cn.dinnerku.com`、`tw.dinnerku.com`：ok（只實測 `www`）
- `www.twbzmg.com`：ok
- `baozimh.vip`：cf；只在搜尋結果出現過，頁尾是「BAOZIMH 包子漫畫」
- 靜態資源：`static-tw.baozimh.com`

## 其他中文漫畫站（候選）

### 有多個網域的

拷貝漫畫：

- `www.mangacopy.com`、`mangacopy.com`：ok
- `www.copy20.com`、`www.2025copy.com`、`www.2026copy.com`、`www.copy3000.com`、`www.copy4000.com`、
  `www.copy5000.com`：ok；多數也有不帶 `www` 的版本；網域常換
- `copymanga.com`、`copymanga.org`、`www.copymanga.tv`、`www.copy-manga.com`：dead（舊網域）
- 注意：網路上有不少仿冒的「最新網址」文章

熱辣漫畫（拷貝姊妹站，含 R18）：

- `www.manga2024.com`、`www.2024manga.com`、`www.manga2025.com`、`www.manga2026.xyz`：ok
- `www.relamanhua.org`：dead（本次無法連線）

漫畫櫃／看漫畫：

- `www.manhuagui.com`、`tw.manhuagui.com`、`m.manhuagui.com`：ok
- `www.mhgui.com`、`m.mhgui.com`：→ `www.manhuagui.com`
- `tw.mhgui.com`：dead

再漫畫（一般認為是動漫之家的後繼）：

- `manhua.zaimanhua.com`、`www.zaimanhua.com`、`m.zaimanhua.com`：ok
- 動漫之家舊網域 `www.dmzj.com`、`manhua.dmzj.com`、`www.idmzj.com`：dead

動漫屋系（同一套系統）：

- `www.dm5.com`、`www.dm5.cn`：ok
- `m.dm5.com`、`tel.dm5.com`、`en.dm5.com`、`cnc.dm5.com`：unverified
- `www.1kkk.com`（極速漫畫）：ok
- `m.1kkk.com`：unverified
- `www.manhuaren.com`（漫畫人）：ok

Mangabz 系（同一套模板）：

- `mangabz.com`、`www.xmanhua.com`、`www.yymanhua.com`：ok

Komiic：

- `komiic.com`、`komiic.cc`：ok

無限動漫（8comic）：

- `www.8comic.com`：ok
- `www.comicabc.com`、`www.comicbus.com`：→ `www.8comic.com`
- 閱讀頁網域：`articles.onemoreplace.tw`、`8.twobili.com`、`a.twobili.com`

COLAMANGA：

- `www.colamanga.com`：→ `www.yoyomanga.com`
- `www.yoyomanga.com`：ok
- 發布頁：`acloudmerge.com`（集雲數據）

漫蛙：

- `manwa.me`：cf
- `mwmissing11.cc`（走失頁）、`manwaxzba.cc`（APP）：ok
- 鏡像 `fuwt.cc`、`manwass.cc`、`manwast.cc`、`manwasy.cc`、`manwatg.cc`：unverified

喜漫漫畫：

- `www.favcomic.com`：ok
- `www.favcomic.xyz`、`www.favcomic.net`、`www.favcomic.cc`：unverified

漫畫狗：

- `dogemanga.com`：ok
- `www.dogemanga.com`：→ `dogemanga.com`

### 單一網域的

- 瓜子漫畫：`www.guazimanhua.com`；ok
- 六漫畫：`www.liumanhua.com`；ok
- MYCOMIC：`mycomic.com`；cf
- vomic漫：`www.vomicmh.com`；ok
- 優酷漫畫：`www.ykmh.net`；ok
- 漫畫屋：`www.mhua5.com`；ok
- 妙趣漫畫：`www.miaoqumh.org`；ok
- 漫畫1234：`m.wmh1234.com`；ok
- 漫畫160：`www.mh160mh.com`；ok
- 92漫畫：`www.92mh.com`；cf
- CManhua：`cmanhua.com`；ok
- 嗶哩漫畫：`www.bilimanga.net`；ok
- 古風漫畫：`gfmh.app`；ok（舊站 `www.gufengmh.com`：dead）
- 漫本：`www.manben.com`；ok
- 讀漫屋：`m.dumanwu1.com`；dead
- 如漫畫：`m.rumanhua2.com`；dead

### 已關站或失效

- 嗨皮漫畫：`www.happymh.com`、`m.happymh.com`；dead；2026-08-14 宣布永久關站
- 動漫狂：`www.cartoonmad.com`、`cartoonmad.cc`；dead（停放頁）
- 新新漫畫：`www.77mh.com`；dead
- 漫畫堆：`www.manhuadui.com`；dead（停放頁）

## R18（僅供參考）

- 禁漫天堂：
  - 網域：`18comic.vip`、`18comic.ink`、`18comic.org`、`jmcomic-zzz.one`、`jmcomic-zzz.org`、
    `comic18j-ada.online`、`comic18j-ada.space`、`comic18j-ada.work`、`18comic-ive.club`、
    `18comic-aspa.org`、`18comic-wantgo.cc`
  - 發布頁：`jmcomic6.org`
- 紳士漫畫：
  - 網域：`www.wnacg.com`、`wnacg.com`
  - 目前的鏡像：`www.wn001.cfd`、`www.wn002.cfd`
  - 舊鏡像：`wn06`、`wn07`、`wn10` 的 `.cfd`、`.shop`
  - 發布頁：`wnacg01.link`
- 18漫畫：`18mh.org`（GoDa 同一網）
- NoyAcg：`noy1.top`、`noymanga.com`
- hanime1：`hanime1.me`、`hanimeone.me`
- 肉漫屋：`rouman5.com`、`roum29.xyz`

## 正版平台（列出避免誤加）

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

1. 修改 `entrypoints/content/sites/<name>.ts` 的 `matches`（新網站還要在 `sites/index.ts` 登記）。
2. 更新本文件。
3. 同步 `PRIVACY.md` 的網站清單與日期，以及 `store/chrome-web-store.md` 的主機權限說明。
4. 依 semver 更新 `package.json` 版本（新網站 → minor）。
