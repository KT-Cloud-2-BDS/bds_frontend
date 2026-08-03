# 빵디즈 (BDS) — Frontend

> 와디즈 클론 코딩 프로젝트

<br>

## 📌 프로젝트 소개

**빵디즈**는 와디즈(Wadiz)를 클론 코딩한 백엔드 개발 프로젝트입니다.

본 저장소는 빵디즈 서비스의 **프론트엔드 프로젝트**로, 각 백엔드 마이크로서비스를 연동하여 사용자에게 화면으로 보여주는 역할을 합니다.

프론트엔드는 API Gateway를 통해 백엔드 서버들과 통신하며, 인증, 펀딩, 주문, 결제, 채팅, 알림 등의 기능을 제공합니다.

<br>

## 🛠 기술 스택

- React
- Vite
- JavaScript
- React Router
- Axios
- Zustand
- STOMP / SockJS
- Tailwind CSS
- Yarn

<br>

## 🚀 실행 방법

### 1. 의존성 설치

```bash
yarn install
```

### 2. 개발 서버 실행

```bash
yarn dev
```

### 3. 서버 접속

```bash
http://localhost:5173
```

### 4. 프로덕션 빌드

```bash
yarn build
```

### 5. 빌드 결과 미리보기

```bash
yarn preview
```

<br>

## ⚙️ 환경 변수 설정

### Local 환경

로컬 실행 시 별도의 환경 변수 설정은 필요하지 않습니다.

### Production 환경

```bash
VITE_API_GATEWAY_URL=
VITE_WS_GATEWAY_URL=
```

<br>

## 🔗 백엔드 서버 구성

프론트엔드는 API Gateway를 통해 각 마이크로서비스와 통신합니다.

| 마이크로서비스 | 로컬 포트 | 라우팅 경로 (Path) | API 명세서 | GitHub Repository |
| :--- | :---: | :---: | :--- | :--- |
| **Auth Service** (인증/회원) | `8081` | `/auths` | [api-spec-auth](https://github.com/KT-Cloud-2-BDS/bds_backend/blob/main/services/auth-service/docs/api-spec-auth.md) | [bds-auth-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/main/services/auth-service) |
| **Chat Service** (채팅) | `8082` | `/chat` | [api-spec-chat](https://github.com/KT-Cloud-2-BDS/bds_backend/blob/main/services/chat-service/docs/api-spec-chat.md) | [bds-chat-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/main/services/chat-service) |
| **Notification Service** (알림) | `8083` | `/notification` | [api-spec-notification](https://github.com/KT-Cloud-2-BDS/bds_backend/blob/main/services/notification-service/docs/api-spec-notification.md) | [bds-notification-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/main/services/notification-service) |
| **Order Service** (주문) | `8084` | `/order` | [api-spec-order](https://github.com/KT-Cloud-2-BDS/bds_backend/blob/main/services/order-service/docs/api-spec-order.md) | [bds-order-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/main/services/order-service) |
| **Payment Service** (결제) | `8085` | `/payment` | [api-spec-payment](https://github.com/KT-Cloud-2-BDS/bds_backend/blob/main/services/payment-service/docs/api-spec-payment.md) | [bds-payment-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/main/services/payment-service) |
| **Gateway Service** | `8000` | `/gateway` | - | [gateway-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/develop/platform/gateway-service) |
| **Discovery Service** | `8761` | - | - | [discovery-service](https://github.com/KT-Cloud-2-BDS/bds_backend/tree/develop/platform/discovery-service) |

<br>

### 기본 실행 필수 서버

- Discovery Service
- Gateway Service
- Auth Service
- Member Service

### 주문 / 결제 기능 관련 서버

- Order Service
- Payment Service

### 채팅 기능 관련 서버

- Chat Service

### 알림 기능 관련 서버

- Notification Service

<br>

## 🗺 페이지별 필요 백엔드 서버

| 페이지 / 기능 | 프론트엔드 경로 | 인증 | 필요한 백엔드 서버 |
| :--- | :--- | :---: | :--- |
| 홈 | `/` | X | Gateway Service, Auth Service |
| 회원가입 | `/signup` | X | Gateway Service, Auth Service |
| 로그인 | `/login` | X | Gateway Service, Auth Service |
| OAuth 콜백 | `/oauth/callback` | O | Gateway Service, Auth Service |
| 소셜 회원가입 | `/social/signup` | X | Gateway Service, Auth Service |
| 비밀번호 재설정 | `/reset-password` | O | Gateway Service, Auth Service |
| 마이페이지 | `/mypage` | O | Gateway Service, Auth Service |
| 펀딩 목록 | `/fundings/list` | X | Gateway Service |
| 펀딩 상세 | `/fundings/:id` | X | Gateway Service |
| 펀딩 생성 | `/fundings/create` | O | Gateway Service, Auth Service |
| 펀딩 결제 진입 | `/fundings/:fundingId/billing/:orderId` | O | Gateway Service, Auth Service, Order Service, Payment Service |
| 주문 결제 결과 | `/order/pay-result` | O | Gateway Service, Auth Service, Order Service, Payment Service |
| 주문 취소 결과 | `/order/cancel-result` | O | Gateway Service, Auth Service, Order Service, Payment Service |
| 예약 주문 결과 | `/order/reserved-result` | O | Gateway Service, Auth Service, Order Service, Payment Service |
| 내 주문 목록 | `/orders` | O | Gateway Service, Auth Service, Order Service |
| 주문 상세 | `/orders/:orderId` | O | Gateway Service, Auth Service, Order Service |
| 지갑 | `/wallet` | O | Gateway Service, Auth Service, Payment Service |
| 지갑 내역 | `/wallet/history` | O | Gateway Service, Auth Service, Payment Service |
| 계좌 등록 | `/wallet/account` | O | Gateway Service, Auth Service, Payment Service |
| 알림 | `/notifications` | O | Gateway Service, Auth Service, Notification Service |
| 펀딩 채팅 | `/fundings/:id/chat` | X | Gateway Service, Chat Service |
| 문의 채팅방 | `/chat/inquiries/:roomId` | O | Gateway Service, Auth Service, Chat Service |
| 문의 목록 | `/chat/inquiries` | O | Gateway Service, Auth Service, Chat Service |
| 채팅 이력 | `/chat/history` | O | Gateway Service, Auth Service, Chat Service |

<br>

## 📡 API 통신 방식

프론트엔드는 `VITE_API_GATEWAY_URL`에 설정된 API Gateway 주소를 기준으로 백엔드 API를 호출합니다.

인증이 필요한 요청의 경우 Access Token을 Authorization Header에 포함하여 요청합니다.

```bash
Authorization: Bearer {accessToken}
```

WebSocket 또는 STOMP 기반 통신이 필요한 채팅 기능은 `VITE_WS_GATEWAY_URL` 설정을 사용합니다.
