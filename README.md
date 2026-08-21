# Surat Embroidery Micro-ERP (Frontend Portal)

Modern, high-performance Progressive Web Application (PWA) and Management Portal for the **Surat Embroidery Job-Work Cluster** (GST SAC 9988). Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and **Nginx**.

---

## 🚀 Features

- **PWA & Offline Capability**: Service Worker and Web App Manifest for mobile/tablet floor operation in embroidery units.
- **Inward / Outward Challans**: Real-time inward fabric meters tracking, outward embroidery stitch counting, and fabric shrinkage auto-warning (> 3.0%).
- **Karigar Shift Logging & Wage Hisab**: Fortnightly wage calculations (1st-15th & 16th-End), Uchapat advances, and piece-rate deduction slips.
- **Munim Client Portal**: Multi-company context switching, Daybook review, and Tally Prime XML bulk export.
- **GST SAC 9988 Invoicing & GSTR-1**: 5% GST computation (CGST + SGST for intra-state Gujarat, IGST for inter-state) and GSTR-1 compliant Excel/JSON export.
- **Machine Health & Diagnostics**: Multi-head embroidery machine telemetry and shift output monitoring.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 / React 18 (App Router, Server & Client Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS, PostCSS
- **State & Data Fetching**: React Hooks, SWR / Context API
- **Containerization**: Docker multi-stage build + Nginx reverse proxy

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Deployment

```bash
docker compose up --build -d
```
Port: `3000` (Reverse proxied via Nginx)
