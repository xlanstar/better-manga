# 漫畫網站網址

所有已支援（以及相關但未支援）的漫畫網站網址。
`matches` 的唯一來源是 `entrypoints/content/sites/<name>.ts`，這份文件只做追蹤與說明；
兩者不一致時以程式碼為準，並回頭修正本文件。

## 已支援

| 網站 | `name` | Match patterns | 網址 | 說明 |
| --- | --- | --- | --- | --- |
| 包子漫畫 | `baozimh` | `*://*.baozimh.org/*`<br>`*://*.bzmh.org/*` | https://baozimh.org<br>https://bzmh.org | 含所有子網域 |
| 韓漫窩 | `g-mh` | `*://m.g-mh.org/*`<br>`*://g-mh.org/*` | https://g-mh.org<br>https://m.g-mh.org | 只用共用閱讀功能，沒有網站專屬修正 |
| 嬉皮漫畫 | `hipmh` | `*://reader.hipmh.top/*` | https://reader.hipmh.top | 只有閱讀器網域；`reader.hipmh.top/chapter/1` 也是截圖用的網址 |

## 相關但未支援

| 網址 | 關聯 | 說明 |
| --- | --- | --- |
| https://m.hipmh.com | 嬉皮漫畫主站 | 章節連結會經過 `m.hipmh.com/chapter/go?hid=…` 跳轉；`hipmh.ts` 會把連結改寫成直接連到 `reader.hipmh.top/chapter/<hid>`，所以不需要在這裡執行 |

## 新增或變更網址時

1. 修改 `entrypoints/content/sites/<name>.ts` 的 `matches`（新網站還要在 `sites/index.ts` 登記）。
2. 更新本文件。
3. 同步 `PRIVACY.md` 的網站清單與日期，以及 `store/chrome-web-store.md` 的主機權限說明。
4. 依 semver 更新 `package.json` 版本（新網站 → minor）。
