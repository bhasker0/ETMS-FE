---
name: etms-fe-pwa-guide
description: Development guide for ETMS-FE Next.js 14 PWA (Offline IndexedDB queues, multi-language i18n, voice shift logging, and thermal print templates).
---

# ETMS-FE PWA & Management Portal Guide

## Key Architectures
1. **PWA & Offline Queue**:
   - `src/lib/offline-store.ts` handles IndexedDB queueing.
   - `OfflineSyncBanner` alerts floor supervisors when syncing queued offline shifts/challans.
2. **Multi-Language**:
   - `src/lib/i18n.tsx` with English, Gujarati, and Hindi dictionaries.
3. **Thermal Printing**:
   - `src/components/ThermalPrintTemplate.tsx` with 58mm/80mm receipt sizing.
