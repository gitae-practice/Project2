# Gitae's Chat 💬

Discord 스타일의 실시간 채팅 & 협업 웹 애플리케이션

## 📌 프로젝트 소개

서버/채널 기반 실시간 채팅과 1:1 다이렉트 메시지를 지원하는 커뮤니케이션 플랫폼입니다.  
Supabase Realtime을 활용해 별도의 WebSocket 서버 없이 실시간 메시지 동기화를 구현했습니다.

## 🚀 주요 기능

- **회원가입 / 로그인** — Supabase Auth 기반 이메일 인증
- **서버 관리** — 서버 생성, 아이콘 이미지 업로드, 멤버 초대
- **채널 채팅** — 텍스트/공지 채널 생성, 실시간 메시지 송수신
- **다이렉트 메시지** — 1:1 실시간 DM
- **멤버 목록** — 서버 멤버 역할(소유자/관리자/멤버) 표시
- **Toast 알림** — 주요 액션에 대한 한글 피드백 알림

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS |
| 상태 관리 | Zustand |
| 백엔드 | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| 아이콘 | Lucide React |
| 날짜 처리 | date-fns |

## 🗂 DB 구조

```
profiles        — 사용자 프로필 (auth.users 확장)
servers         — 서버 (워크스페이스)
server_members  — 서버 멤버 + 역할 관리
channels        — 채널 (텍스트 / 공지)
messages        — 채널 메시지 (Realtime)
direct_messages — 1:1 다이렉트 메시지 (Realtime)
```

## ⚙️ 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/gitae-practice/Project2.git
cd Project2

# 2. 패키지 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase URL과 ANON KEY 입력

# 4. Supabase DB 설정
# supabase_schema.sql 파일을 Supabase SQL Editor에서 실행

# 5. 개발 서버 실행
npm run dev
```

## 🔑 환경변수

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
