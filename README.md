# Posquare 社群網站 (後端)

## Project Description

Posquare 是採前後端分離的仿社群網站作品，此 repo 為後端部分，
前端 repo: https://github.com/Aswexx/client

整體專案架構與一些功能製作的規劃與一些實作細節，請參考以下用 reveal.js 作的簡報:
https://aswexx.github.io/posquare-presentation/


### 後端主要處理事務
1. 使用者帳號登入驗證、 token 發給與更新。
2. 連線 PosgreSQL 資料庫進行關於發文、留言、按讚、追蹤(取消追蹤)等的 CRUD 操作。
3. 處理前端上傳檔案(圖片或短影片)，存至 AWS S3 Bucket。
4. 實作即時聊天功能的 socket 相關邏輯。
5. 以 Event Emitter 與 socket.io 搭配實作特定條件(如被追蹤、被按讚、被留言)推送即時通知給使用者。
6. 實作 LINE PAY 串接 (測試支付)，處理從前端發起的支付到接收 LINE PAY 回應後的過程。
7. 連結 Redis，暫存部分功能相關的資料，例如:暫存前端請求內容、暫存免重複登入的驗證紀錄、等待註冊信箱驗證、等待實際支付、即時聊天紀錄等。
8. 製作 log 檔案，存下請求與回覆的相關資訊及進到特定 route 的紀錄，並且排程固定時間點存至 AWS S3 Bucket。

### 主要使用工具
<li>Express</li>
<li>prisma</li>
<li>cookie-parser</li>
<li>jsonwebtoken</li>
<li>cors</li>
<li>bcrypt</li>
<li>helmet</li>
<li>morgan、winston</li>
<li>node-schedule</li>
<li>nodemailer</li>
<li>redis</li>
<li>aws-sdk (s3、secrets manager 相關)</li>



## 成品展示
請至 https://joeln.site/

登入方式:
1. 使用 Google 帳號登入
2. 使用非 gmail 信箱註冊新帳號後登入(需收驗證碼信)
3. 直接使用以下任一組測試帳號密碼登入:

- 帳號: test1@example.com
密碼: 123
- 帳號: test2@example.com
密碼: 123
- 帳號: test3@example.com
密碼: 123
- 帳號: test4@example.com
密碼: 123

===========

## Project Description
Posquare is a social networking website that adopts a front-end and back-end separation. This repo is for the back-end part, and the front-end repo can be found at: https://github.com/Aswexx/client

For the overall project architecture, some functionality development plans, and some implementation details, please refer to the presentation made with reveal.js: https://aswexx.github.io/posquare-presentation/

### Main Tasks of the Backend
1. User account login authentication.
2. Connect to the PostgreSQL database to perform CRUD operations related to posting, commenting, liking, and following/unfollowing.
3. Handle file uploads from the front-end (images or short videos) and save them to AWS S3 Bucket.
4. Implement socket-related logic for real-time chat functionality.
5. Use Event Emitter and socket.io to implement real-time notification push to users under specific conditions (such as being followed, liked, or commented).
6. Implement LINE PAY integration (test payment), handle the process from initiating payment from the front-end to receiving the response from LINE PAY.
7. Connect to Redis to temporarily store data related to certain functionalities, such as temporarily storing front-end request content, storing verification records for avoiding repeated logins, waiting for email verification, waiting for actual payment, and real-time chat records.
8. Create log files to record relevant information about requests and responses and the records of entering specific routes, and schedule the files to be stored in AWS S3 Bucket at fixed times.

## Main Tools Used
<li>Express</li>
<li>prisma</li>
<li>cookie-parser</li>
<li>jsonwebtoken</li>
<li>cors</li>
<li>bcrypt</li>
<li>helmet</li>
<li>morgan, winston</li>
<li>node-schedule</li>
<li>nodemailer</li>
<li>redis</li>
<li>aws-sdk (s3, secrets manager related)</li>


## DEMO
Please visit https://joeln.site/

Login methods:

1. Login with a Google account.
2. Register a new account using a non-gmail email and then log in (verification code email required).
3. Login directly with any of the following test account usernames and 
passwords:

- Username: test1@example.com
Password: 123
- Username: test2@example.com
Password: 123
- Username: test3@example.com
Password: 123
- Username: test4@example.com
Password: 123