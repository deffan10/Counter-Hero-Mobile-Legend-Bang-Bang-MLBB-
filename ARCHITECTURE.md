# MLBB Counter Hero Platform - Architecture Document

## 📋 Overview

Platform web & mobile untuk Mobile Legends: Bang Bang yang menyediakan fitur counter hero, hero explanation, item build, battle spell, tier list, combo hero, statistik, dan auto-update data.

---

## 🏗️ 1. Arsitektur Sistem (High-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE CDN/WAF                            │
│                    (DDoS Protection, Cache, SSL)                     │
└─────────────────────┬───────────────────────────────┬───────────────┘
                      │                               │
                      ▼                               ▼
┌─────────────────────────────┐     ┌─────────────────────────────────┐
│     NGINX REVERSE PROXY     │     │      FLUTTER MOBILE APP         │
│   (Load Balancer, SSL)      │     │      (Android / iOS)            │
└──────────┬──────────────────┘     └──────────────┬──────────────────┘
           │                                       │
           ▼                                       │
┌─────────────────────────────┐                    │
│    NEXT.JS FRONTEND (SSR)   │                    │
│    (Web App + SEO)          │                    │
└──────────┬──────────────────┘                    │
           │                                       │
           ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NESTJS BACKEND API (PM2)                        │
│              ┌──────────────────────────────────┐                   │
│              │  REST API v1  │  GraphQL (opt)   │                   │
│              └──────────────────────────────────┘                   │
│              ┌──────────────────────────────────┐                   │
│              │  Auth Module  │  Rate Limiter    │                   │
│              └──────────────────────────────────┘                   │
└──────────┬──────────────┬───────────────┬───────────────────────────┘
           │              │               │
           ▼              ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│   MARIADB    │  │    REDIS     │  │   BULLMQ QUEUE WORKER    │
│  (Primary)   │  │ Cache+Queue  │  │  (Scraping + Processing) │
└──────────────┘  └──────────────┘  └──────────────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  SCRAPER ENGINE  │
                                    │  (Puppeteer/     │
                                    │   Playwright)    │
                                    └──────────────────┘
```


---

## 🔧 2. Technology Stack (2026 Modern Stack)

| Layer | Technology | Alasan |
|-------|-----------|--------|
| **Backend API** | NestJS (Node.js 22 LTS) | TypeScript, modular, scalable, decorator-based |
| **Frontend Web** | Next.js 15 (App Router) | SSR/SSG, SEO friendly, React ecosystem |
| **Mobile** | Flutter 3.x | Cross-platform, single codebase Android/iOS |
| **Database** | MariaDB 11.x | Sesuai VPS existing, reliable RDBMS |
| **Cache** | Redis 7.x (Valkey) | In-memory cache, pub/sub, queue backend |
| **Queue** | BullMQ | Redis-based, reliable job processing |
| **Scraper** | Playwright | Modern browser automation, stealth mode |
| **Process Manager** | PM2 | Cluster mode, auto-restart, monitoring |
| **Reverse Proxy** | Nginx | Load balancing, SSL termination, caching |
| **Container** | Docker + Docker Compose | Isolasi service, reproducible deployment |
| **CDN/WAF** | Cloudflare | DDoS protection, edge caching, SSL |
| **Monitoring** | Prometheus + Grafana | Metrics, alerting, dashboard |
| **Logging** | Pino + Loki | Structured logging, centralized |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Auth** | JWT + API Key | Stateless auth, mobile-friendly |
| **Validation** | Zod / class-validator | Runtime type safety |
| **ORM** | Prisma | Type-safe database access, migrations |

---

## 🗄️ 3. Database Schema (ERD - MariaDB)

### Entity Relationship Diagram

```
┌───────────────┐       ┌──────────────────┐       ┌───────────────────┐
│    heroes     │       │  hero_counters   │       │   hero_skills     │
├───────────────┤       ├──────────────────┤       ├───────────────────┤
│ id (PK)       │◄──┐   │ id (PK)          │       │ id (PK)           │
│ name          │   ├───│ hero_id (FK)     │   ┌──►│ hero_id (FK)      │
│ slug          │   │   │ counter_id (FK)  │───┘   │ skill_name        │
│ role          │   │   │ effectiveness    │       │ skill_type        │
│ specialty     │   │   │ explanation      │       │ description       │
│ difficulty    │   │   │ tips             │       │ cooldown          │
│ image_url     │   │   │ created_at       │       │ mana_cost         │
│ icon_url      │   │   │ updated_at       │       │ damage_type       │
│ lore          │   │   └──────────────────┘       │ image_url         │
│ release_date  │   │                               └───────────────────┘
│ is_active     │   │
│ created_at    │   │   ┌──────────────────┐       ┌───────────────────┐
│ updated_at    │   │   │  hero_stats      │       │  hero_combos      │
└───────────────┘   │   ├──────────────────┤       ├───────────────────┤
                    ├───│ id (PK)          │       │ id (PK)           │
                    │   │ hero_id (FK)     │       │ name              │
                    │   │ winrate          │       │ description       │
                    │   │ pickrate         │       │ strategy          │
                    │   │ banrate          │       │ difficulty        │
                    │   │ rank_tier        │       │ synergy_score     │
                    │   │ patch_version    │       │ created_at        │
                    │   │ recorded_at      │       │ updated_at        │
                    │   │ created_at       │       └───────┬───────────┘
                    │   └──────────────────┘               │
                    │                               ┌───────────────────┐
                    │   ┌──────────────────┐       │ combo_heroes      │
                    │   │    items         │       ├───────────────────┤
                    │   ├──────────────────┤       │ id (PK)           │
                    │   │ id (PK)          │       │ combo_id (FK)     │
                    │   │ name             │       │ hero_id (FK)      │
                    │   │ slug             │       │ role_in_combo     │
                    │   │ type             │       └───────────────────┘
                    │   │ category         │
                    │   │ price            │       ┌───────────────────┐
                    │   │ stats (JSON)     │       │  tier_lists       │
                    │   │ passive          │       ├───────────────────┤
                    │   │ description      │       │ id (PK)           │
                    │   │ image_url        │   ┌───│ hero_id (FK)      │
                    │   │ is_active        │   │   │ tier (S/A/B/C/D)  │
                    │   │ created_at       │   │   │ rank_tier         │
                    │   │ updated_at       │   │   │ role_tier         │
                    │   └──────────────────┘   │   │ patch_version     │
                    │                           │   │ reasoning         │
                    │   ┌──────────────────┐   │   │ created_at        │
                    │   │  battle_spells   │   │   │ updated_at        │
                    │   ├──────────────────┤   │   └───────────────────┘
                    │   │ id (PK)          │   │
                    │   │ name             │   │   ┌───────────────────┐
                    │   │ slug             │   │   │  hero_builds      │
                    │   │ description      │   │   ├───────────────────┤
                    │   │ cooldown         │   │   │ id (PK)           │
                    │   │ image_url        │   ├───│ hero_id (FK)      │
                    │   │ is_active        │   │   │ build_name        │
                    │   │ created_at       │   │   │ build_type        │
                    │   │ updated_at       │   │   │ description       │
                    │   └──────────────────┘   │   │ winrate           │
                    │                           │   │ popularity        │
                    │   ┌──────────────────┐   │   │ created_at        │
                    │   │ hero_spell_recs  │   │   │ updated_at        │
                    │   ├──────────────────┤   │   └───────┬───────────┘
                    └───│ id (PK)          │   │           │
                        │ hero_id (FK)     │   │   ┌───────────────────┐
                        │ spell_id (FK)    │   │   │ build_items       │
                        │ priority         │   │   ├───────────────────┤
                        │ explanation      │   │   │ id (PK)           │
                        │ situation        │   │   │ build_id (FK)     │
                        └──────────────────┘   │   │ item_id (FK)      │
                                               │   │ slot_order        │
                    ┌──────────────────┐       │   └───────────────────┘
                    │  scrape_logs     │       │
                    ├──────────────────┤       │   ┌───────────────────┐
                    │ id (PK)          │       │   │  patches          │
                    │ source           │       │   ├───────────────────┤
                    │ job_type         │       │   │ id (PK)           │
                    │ status           │       │   │ version           │
                    │ records_affected │       │   │ title             │
                    │ error_message    │       │   │ release_date      │
                    │ duration_ms      │       │   │ notes (TEXT)      │
                    │ started_at       │       │   │ created_at        │
                    │ completed_at     │       │   └───────────────────┘
                    └──────────────────┘       │
                                               │   ┌───────────────────┐
                    ┌──────────────────┐       │   │  api_keys         │
                    │  cache_entries   │       │   ├───────────────────┤
                    ├──────────────────┤       │   │ id (PK)           │
                    │ id (PK)          │       │   │ key_hash          │
                    │ cache_key        │       │   │ name              │
                    │ ttl_seconds      │       │   │ permissions       │
                    │ hit_count        │       │   │ rate_limit        │
                    │ last_accessed    │       │   │ is_active         │
                    │ expires_at       │       │   │ last_used_at      │
                    │ created_at       │       │   │ created_at        │
                    └──────────────────┘       │   └───────────────────┘
                                               │
                    ┌──────────────────┐       │   ┌───────────────────┐
                    │  admin_users     │       │   │  notifications    │
                    ├──────────────────┤       │   ├───────────────────┤
                    │ id (PK)          │       │   │ id (PK)           │
                    │ username         │       │   │ type              │
                    │ email            │       │   │ title             │
                    │ password_hash    │       │   │ message           │
                    │ role             │       │   │ is_read           │
                    │ is_active        │       │   │ created_at        │
                    │ last_login       │       │   └───────────────────┘
                    │ created_at       │       │
                    └──────────────────┘       │
                                               │
```


### SQL Schema (Core Tables)

```sql
-- Heroes
CREATE TABLE heroes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('Tank','Fighter','Assassin','Mage','Marksman','Support') NOT NULL,
  specialty VARCHAR(100),
  difficulty TINYINT UNSIGNED DEFAULT 1,
  image_url VARCHAR(500),
  icon_url VARCHAR(500),
  lore TEXT,
  lane ENUM('Gold','Exp','Mid','Roam','Jungle'),
  release_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_slug (slug),
  INDEX idx_lane (lane)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hero Counters
CREATE TABLE hero_counters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hero_id INT UNSIGNED NOT NULL,
  counter_id INT UNSIGNED NOT NULL,
  effectiveness TINYINT UNSIGNED DEFAULT 50, -- 0-100 score
  explanation TEXT,
  tips TEXT,
  source VARCHAR(50) DEFAULT 'scraper',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
  FOREIGN KEY (counter_id) REFERENCES heroes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_hero_counter (hero_id, counter_id),
  INDEX idx_effectiveness (effectiveness DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hero Stats (Time Series)
CREATE TABLE hero_stats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hero_id INT UNSIGNED NOT NULL,
  winrate DECIMAL(5,2),
  pickrate DECIMAL(5,2),
  banrate DECIMAL(5,2),
  rank_tier ENUM('All','Mythic','Legend','Epic','Grandmaster') DEFAULT 'All',
  patch_version VARCHAR(20),
  recorded_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
  INDEX idx_hero_date (hero_id, recorded_at DESC),
  INDEX idx_rank_tier (rank_tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Items
CREATE TABLE items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('Attack','Magic','Defense','Movement','Jungle','Roam') NOT NULL,
  category VARCHAR(50),
  price INT UNSIGNED DEFAULT 0,
  stats JSON,
  passive_name VARCHAR(100),
  passive_description TEXT,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Battle Spells
CREATE TABLE battle_spells (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  cooldown INT UNSIGNED,
  unlock_level TINYINT UNSIGNED,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tier Lists
CREATE TABLE tier_lists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hero_id INT UNSIGNED NOT NULL,
  tier ENUM('S+','S','A','B','C','D') NOT NULL,
  rank_tier ENUM('All','Mythic','Legend','Epic') DEFAULT 'All',
  role_context VARCHAR(50),
  patch_version VARCHAR(20),
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_hero_rank_patch (hero_id, rank_tier, patch_version),
  INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hero Combos
CREATE TABLE hero_combos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  strategy TEXT,
  difficulty TINYINT UNSIGNED DEFAULT 1,
  synergy_score TINYINT UNSIGNED DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE combo_heroes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  combo_id INT UNSIGNED NOT NULL,
  hero_id INT UNSIGNED NOT NULL,
  role_in_combo VARCHAR(50),
  FOREIGN KEY (combo_id) REFERENCES hero_combos(id) ON DELETE CASCADE,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Scrape Logs
CREATE TABLE scrape_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  status ENUM('pending','running','completed','failed') DEFAULT 'pending',
  records_affected INT UNSIGNED DEFAULT 0,
  error_message TEXT,
  duration_ms INT UNSIGNED,
  metadata JSON,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_source_date (source, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API Keys
CREATE TABLE api_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  permissions JSON DEFAULT '["read"]',
  rate_limit INT UNSIGNED DEFAULT 100, -- per minute
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Users
CREATE TABLE admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin','editor') DEFAULT 'editor',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```


---

## 🌐 4. API Structure (REST API v1)

### Base URL
```
Production: https://api.mlbb-counter.com/v1
Staging:    https://api-staging.mlbb-counter.com/v1
```

### Authentication Headers
```
X-API-Key: <api-key>           // For Flutter/3rd party
Authorization: Bearer <jwt>     // For admin panel
```

### Endpoints

#### Heroes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/heroes` | List all heroes (paginated, filterable) |
| GET | `/heroes/:slug` | Get hero detail |
| GET | `/heroes/:slug/counters` | Get hero counters |
| GET | `/heroes/:slug/builds` | Get recommended builds |
| GET | `/heroes/:slug/spells` | Get recommended spells |
| GET | `/heroes/:slug/stats` | Get hero statistics |
| GET | `/heroes/:slug/combos` | Get hero combos |
| GET | `/heroes/search?q=` | Search heroes |

#### Counter
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/counters/:heroSlug` | Get counters for a hero |
| GET | `/counters/:heroSlug/details` | Detailed counter info with tips |
| GET | `/counters/matchup/:hero1/:hero2` | Compare two heroes |

#### Items & Builds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | List all items (filterable by type) |
| GET | `/items/:slug` | Get item detail |
| GET | `/builds/popular` | Popular builds |
| GET | `/builds/:heroSlug` | Builds for specific hero |

#### Battle Spells
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/spells` | List all battle spells |
| GET | `/spells/:slug` | Get spell detail |
| GET | `/spells/recommended/:heroSlug` | Recommended spells for hero |

#### Tier List
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tier-list` | Current tier list |
| GET | `/tier-list?rank=mythic` | Tier list by rank |
| GET | `/tier-list?role=assassin` | Tier list by role |
| GET | `/tier-list/history` | Tier list changes over time |

#### Combos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/combos` | List all combos |
| GET | `/combos/:id` | Combo detail |
| GET | `/combos/suggest?heroes=1,2,3` | Suggest combos based on picks |

#### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats/winrate` | Winrate leaderboard |
| GET | `/stats/pickrate` | Pickrate leaderboard |
| GET | `/stats/banrate` | Banrate leaderboard |
| GET | `/stats/trends/:heroSlug` | Hero stat trends |
| GET | `/stats/meta` | Current meta summary |

#### Admin (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/scrape/status` | Scraping status |
| POST | `/admin/scrape/trigger/:jobType` | Trigger manual scrape |
| GET | `/admin/scrape/logs` | View scrape logs |
| GET | `/admin/cache/stats` | Cache statistics |
| POST | `/admin/cache/flush/:key` | Flush specific cache |
| GET | `/admin/dashboard` | Dashboard metrics |

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  },
  "cache": {
    "hit": true,
    "ttl": 3600,
    "cached_at": "2026-05-21T10:00:00Z"
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "HERO_NOT_FOUND",
    "message": "Hero with slug 'xyz' not found",
    "status": 404
  }
}
```

### Query Parameters (Global)
```
?page=1&per_page=20          // Pagination
?sort=winrate&order=desc     // Sorting
?role=assassin               // Filtering
?rank=mythic                 // Rank filter
?patch=1.8.50                // Patch filter
?lang=id                     // Language (id/en)
?fields=name,role,winrate    // Sparse fields
```


---

## 📁 5. Struktur Folder Project

```
mlbb-counter/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── packages/                        # Monorepo (Turborepo)
│   ├── backend/                     # NestJS API
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── ecosystem.config.js      # PM2 config
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   └── utils/
│   │   │   ├── config/
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   └── scraper.config.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── guards/
│   │   │   │   │   └── strategies/
│   │   │   │   ├── heroes/
│   │   │   │   │   ├── heroes.module.ts
│   │   │   │   │   ├── heroes.controller.ts
│   │   │   │   │   ├── heroes.service.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── entities/
│   │   │   │   ├── counters/
│   │   │   │   ├── items/
│   │   │   │   ├── spells/
│   │   │   │   ├── tier-list/
│   │   │   │   ├── combos/
│   │   │   │   ├── stats/
│   │   │   │   ├── builds/
│   │   │   │   ├── scraper/
│   │   │   │   │   ├── scraper.module.ts
│   │   │   │   │   ├── scraper.service.ts
│   │   │   │   │   ├── scraper.processor.ts
│   │   │   │   │   ├── scrapers/
│   │   │   │   │   │   ├── hero.scraper.ts
│   │   │   │   │   │   ├── stats.scraper.ts
│   │   │   │   │   │   ├── item.scraper.ts
│   │   │   │   │   │   └── spell.scraper.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── puppeteer.strategy.ts
│   │   │   │   │   │   └── api.strategy.ts
│   │   │   │   │   └── utils/
│   │   │   │   │       ├── proxy-rotator.ts
│   │   │   │   │       ├── rate-limiter.ts
│   │   │   │   │       └── stealth.ts
│   │   │   │   ├── cache/
│   │   │   │   │   ├── cache.module.ts
│   │   │   │   │   ├── cache.service.ts
│   │   │   │   │   └── cache.interceptor.ts
│   │   │   │   ├── queue/
│   │   │   │   │   ├── queue.module.ts
│   │   │   │   │   ├── queue.service.ts
│   │   │   │   │   └── processors/
│   │   │   │   └── admin/
│   │   │   │       ├── admin.module.ts
│   │   │   │       ├── admin.controller.ts
│   │   │   │       └── admin.service.ts
│   │   │   └── shared/
│   │   │       ├── database/
│   │   │       ├── redis/
│   │   │       └── logger/
│   │   └── test/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   │
│   ├── frontend/                    # Next.js Web
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── heroes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── counter/
│   │   │   │   ├── items/
│   │   │   │   ├── tier-list/
│   │   │   │   ├── combos/
│   │   │   │   ├── stats/
│   │   │   │   └── admin/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   └── utils.ts
│   │   │   └── styles/
│   │   └── public/
│   │       └── images/
│   │
│   └── shared/                      # Shared types & utils
│       ├── package.json
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── validators/
│       └── tsconfig.json
│
├── mobile/                          # Flutter App
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/
│   │   │   ├── app.dart
│   │   │   └── routes.dart
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   ├── api_client.dart
│   │   │   │   ├── api_interceptor.dart
│   │   │   │   └── endpoints.dart
│   │   │   ├── constants/
│   │   │   ├── theme/
│   │   │   └── utils/
│   │   ├── features/
│   │   │   ├── heroes/
│   │   │   ├── counter/
│   │   │   ├── items/
│   │   │   ├── tier_list/
│   │   │   ├── combos/
│   │   │   └── stats/
│   │   └── shared/
│   │       ├── models/
│   │       ├── widgets/
│   │       └── providers/
│   ├── pubspec.yaml
│   └── Dockerfile              # For CI/CD build
│
├── infra/                          # Infrastructure
│   ├── nginx/
│   │   ├── nginx.conf
│   │   ├── sites-available/
│   │   │   ├── api.conf
│   │   │   └── web.conf
│   │   └── ssl/
│   ├── redis/
│   │   └── redis.conf
│   ├── mariadb/
│   │   └── my.cnf
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana/
│           └── dashboards/
│
├── scripts/
│   ├── deploy.sh
│   ├── backup-db.sh
│   ├── seed-data.sh
│   └── health-check.sh
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SCRAPING.md
│   └── CONTRIBUTING.md
│
├── turbo.json
├── package.json
└── .env.example
```


---

## 🕷️ 6. Scraping System

### Flow Scraping

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CRON/ADMIN  │────►│  BULLMQ      │────►│  SCRAPER     │
│  TRIGGER     │     │  QUEUE       │     │  WORKER      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┤
                     │                            │
                     ▼                            ▼
          ┌──────────────────┐         ┌──────────────────┐
          │  PLAYWRIGHT      │         │  HTTP/API        │
          │  (Dynamic Pages) │         │  (Static Data)   │
          └────────┬─────────┘         └────────┬─────────┘
                   │                            │
                   ▼                            ▼
          ┌─────────────────────────────────────────────┐
          │              DATA TRANSFORMER                │
          │   (Clean, Validate, Normalize, Compare)     │
          └────────────────────┬────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐
          │ MARIADB  │ │  REDIS   │ │  NOTIFY  │
          │ (Store)  │ │ (Inval.) │ │  (Admin) │
          └──────────┘ └──────────┘ └──────────┘
```

### Scraper Schedule (Cron)

| Job | Schedule | Source | Priority |
|-----|----------|--------|----------|
| Hero Data | Every 6 hours | MLBB Official | High |
| Win/Pick/Ban Rate | Every 2 hours | Stats Sources | Critical |
| Item Data | Every 12 hours | MLBB Official | Medium |
| Battle Spells | Daily | MLBB Official | Low |
| Tier List | Every 4 hours | Community + Stats | High |
| Patch Notes | Every 1 hour | MLBB Official | Critical |
| Counter Data | Every 4 hours | Multiple Sources | High |

### Scraper Safety Features

1. **Rate Limiting** - Max 1 request/2 seconds per source
2. **Proxy Rotation** - Pool of rotating proxies
3. **User-Agent Rotation** - Random realistic user agents
4. **Stealth Mode** - Playwright stealth plugin
5. **Retry Logic** - Exponential backoff (3 attempts)
6. **Circuit Breaker** - Disable scraper if 5 consecutive failures
7. **Diff Detection** - Only update if data actually changed
8. **robots.txt Compliance** - Respect crawl directives
9. **Concurrency Control** - Max 3 concurrent scrape jobs
10. **Timeout Protection** - 30s page load timeout

### Data Sources (Priority Order)

1. MLBB Official Website/API
2. Community Stats Aggregators
3. In-game data extraction (API reverse engineering)
4. Community wikis (fallback)


---

## 🗃️ 7. Caching Strategy

### Cache Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: Cloudflare Edge Cache             │
│  TTL: 5-60 minutes (by endpoint type)       │
│  Hit Rate Target: 80%+                       │
└─────────────────────────────────────────────┘
         │ MISS
         ▼
┌─────────────────────────────────────────────┐
│  Layer 2: Nginx Proxy Cache (Optional)      │
│  TTL: 2-10 minutes                          │
└─────────────────────────────────────────────┘
         │ MISS
         ▼
┌─────────────────────────────────────────────┐
│  Layer 3: Redis Application Cache           │
│  TTL: Varies by data type                   │
│  Strategy: Cache-Aside + Write-Through      │
└─────────────────────────────────────────────┘
         │ MISS
         ▼
┌─────────────────────────────────────────────┐
│  Layer 4: MariaDB Query Cache               │
│  (Built-in query result cache)              │
└─────────────────────────────────────────────┘
```

### Cache TTL by Data Type

| Data Type | Redis TTL | Cloudflare TTL | Invalidation |
|-----------|-----------|----------------|--------------|
| Hero List | 1 hour | 30 min | On scrape update |
| Hero Detail | 2 hours | 1 hour | On scrape update |
| Counter Data | 30 min | 15 min | On scrape update |
| Win/Pick Rate | 15 min | 5 min | On new stats |
| Tier List | 1 hour | 30 min | On recalculation |
| Items | 6 hours | 2 hours | On patch update |
| Spells | 12 hours | 6 hours | On patch update |
| Combos | 2 hours | 1 hour | On update |
| Search Results | 10 min | 5 min | LRU eviction |

### Cache Key Pattern
```
mlbb:v1:{resource}:{identifier}:{variant}
mlbb:v1:hero:fanny:detail
mlbb:v1:hero:fanny:counters
mlbb:v1:stats:winrate:mythic:page:1
mlbb:v1:tierlist:all:latest
mlbb:v1:search:heroes:q:fann
```

### Cache Invalidation Strategy
1. **Event-Driven** - Scraper invalidates related cache keys after update
2. **TTL-Based** - Natural expiration as fallback
3. **Manual Flush** - Admin panel can flush specific keys/patterns
4. **Versioned Keys** - Patch version in key for automatic rollover

---

## 🔒 8. Security Best Practices

### Application Security
- **Input Validation** - Zod/class-validator on all inputs
- **SQL Injection** - Prisma ORM (parameterized queries)
- **XSS Prevention** - Content-Security-Policy headers, sanitization
- **CSRF Protection** - SameSite cookies, CSRF tokens for admin
- **Rate Limiting** - Per IP + Per API key (100 req/min default)
- **Helmet.js** - Security headers middleware
- **CORS** - Whitelist specific origins

### Authentication & Authorization
```
┌──────────────────────────────────────────────────────────┐
│                    AUTH FLOW                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Flutter App ──► API Key (X-API-Key header)             │
│       │                                                  │
│       └──► Rate limit: 100 req/min per key              │
│                                                          │
│  Web Frontend ──► Session-based (httpOnly cookie)       │
│       │                                                  │
│       └──► CSRF token required for mutations            │
│                                                          │
│  Admin Panel ──► JWT Bearer Token                       │
│       │                                                  │
│       ├──► Access token: 15 min TTL                     │
│       ├──► Refresh token: 7 days TTL                    │
│       └──► RBAC (superadmin/admin/editor)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Infrastructure Security
- **Cloudflare WAF** - Block common attack patterns
- **Fail2ban** - Block brute force attempts
- **UFW/iptables** - Only expose ports 80, 443
- **SSH Key Only** - Disable password auth
- **Docker Secrets** - Sensitive config management
- **Environment Variables** - No secrets in code
- **Dependency Audit** - `npm audit` in CI/CD
- **Non-root containers** - Run processes as unprivileged user

### Rate Limiting Strategy
```
┌─────────────────────────────────────────┐
│         RATE LIMITING TIERS             │
├──────────┬──────────┬───────────────────┤
│  Tier    │  Limit   │  Scope            │
├──────────┼──────────┼───────────────────┤
│  Free    │  60/min  │  Per IP           │
│  Basic   │  100/min │  Per API Key      │
│  Pro     │  500/min │  Per API Key      │
│  Admin   │  1000/min│  Per JWT          │
│  Scraper │  10/min  │  Per source       │
└──────────┴──────────┴───────────────────┘

Algorithm: Sliding Window (Redis ZSET)
Burst: Allow 2x limit in 10s window
Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```


---

## 🐳 9. Docker Setup

### docker-compose.yml (Development)
```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mysql://mlbb:mlbb_pass@mariadb:3306/mlbb_counter
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./packages/backend/src:/app/src
    depends_on:
      - mariadb
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000/v1
    volumes:
      - ./packages/frontend/src:/app/src
    depends_on:
      - backend
    restart: unless-stopped

  scraper-worker:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
      target: development
    command: node dist/worker.js
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mysql://mlbb:mlbb_pass@mariadb:3306/mlbb_counter
      - REDIS_URL=redis://redis:6379
      - WORKER_MODE=true
    depends_on:
      - mariadb
      - redis
    restart: unless-stopped

  mariadb:
    image: mariadb:11.4
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root_pass
      - MYSQL_DATABASE=mlbb_counter
      - MYSQL_USER=mlbb
      - MYSQL_PASSWORD=mlbb_pass
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./infra/mariadb/my.cnf:/etc/mysql/conf.d/custom.cnf
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./infra/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - mariadb

volumes:
  mariadb_data:
  redis_data:
```

### docker-compose.prod.yml
```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
      target: production
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
      target: production
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
    restart: always

  scraper-worker:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
      target: production
    command: node dist/worker.js
    env_file:
      - .env.production
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          memory: 300M
    restart: always

volumes:
  redis_data:
```

### Backend Dockerfile (Multi-stage)
```dockerfile
# Base
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules prod_modules
RUN npm ci

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "start:dev"]

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=deps /app/prod_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
```


---

## 🌐 10. Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/mlbb-api.conf

upstream backend_cluster {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;  # If running multiple instances
    keepalive 32;
}

upstream frontend_cluster {
    server 127.0.0.1:4000;
    keepalive 16;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_general:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=api_search:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=admin:10m rate=20r/m;

# Cache zone
proxy_cache_path /var/cache/nginx/mlbb levels=1:2 keys_zone=mlbb_cache:10m
                 max_size=1g inactive=60m use_temp_path=off;

# API Server
server {
    listen 80;
    server_name api.mlbb-counter.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.mlbb-counter.com;

    # SSL (Cloudflare Origin Certificate)
    ssl_certificate /etc/nginx/ssl/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/origin-key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types application/json text/plain application/javascript;
    gzip_min_length 256;

    # API endpoints
    location /v1/ {
        limit_req zone=api_general burst=20 nodelay;

        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Proxy cache for GET requests
        proxy_cache mlbb_cache;
        proxy_cache_methods GET;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_use_stale error timeout http_500 http_502 http_503;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # Search endpoint (stricter rate limit)
    location /v1/heroes/search {
        limit_req zone=api_search burst=10 nodelay;
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin endpoints
    location /v1/admin/ {
        limit_req zone=admin burst=5 nodelay;
        
        # IP whitelist (optional)
        # allow 103.x.x.x;
        # deny all;

        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check
    location /health {
        proxy_pass http://backend_cluster;
        access_log off;
    }
}

# Web Frontend
server {
    listen 443 ssl http2;
    server_name mlbb-counter.com www.mlbb-counter.com;

    ssl_certificate /etc/nginx/ssl/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/origin-key.pem;

    location / {
        proxy_pass http://frontend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets (long cache)
    location /_next/static/ {
        proxy_pass http://frontend_cluster;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```


---

## 📱 11. Flutter API Integration Strategy

### Architecture Pattern: Clean Architecture + Riverpod

```dart
// lib/core/api/api_client.dart
class ApiClient {
  static const String baseUrl = 'https://api.mlbb-counter.com/v1';
  static const String apiKey = String.fromEnvironment('API_KEY');
  
  final Dio _dio;
  
  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10),
    headers: {
      'X-API-Key': apiKey,
      'Accept': 'application/json',
      'X-App-Version': '1.0.0',
      'X-Platform': Platform.isAndroid ? 'android' : 'ios',
    },
  )) {
    _dio.interceptors.addAll([
      CacheInterceptor(),
      RetryInterceptor(retries: 3),
      LogInterceptor(),
    ]);
  }
}
```

### Offline-First Strategy
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Layer   │────►│  Repository  │────►│  Remote API  │
│              │     │   Pattern    │     │  (Dio HTTP)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Local Cache │
                     │  (Hive/Isar) │
                     └──────────────┘

Strategy:
1. Check local cache first (Stale-While-Revalidate)
2. If fresh → return cached
3. If stale → return cached + fetch background update
4. If no cache → fetch from API + cache result
```

### Key Flutter Packages
| Package | Purpose |
|---------|---------|
| `dio` | HTTP client with interceptors |
| `riverpod` | State management |
| `freezed` | Immutable models with JSON serialization |
| `go_router` | Navigation & deep linking |
| `hive` / `isar` | Local database/cache |
| `cached_network_image` | Image caching |
| `flutter_animate` | Smooth animations |
| `connectivity_plus` | Network state monitoring |

### API Versioning for Mobile
```
Headers: X-API-Version: 1
If breaking change → X-API-Version: 2 (server returns compatible response)
Minimum version check on app startup → force update if needed
```


---

## 🔄 12. CI/CD Workflow

### GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      mariadb:
        image: mariadb:11.4
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: mlbb_test
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          context: ./packages/backend
          push: false
          tags: mlbb-backend:test

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/mlbb-counter
            git pull origin develop
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker system prune -f

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/mlbb-counter
            git pull origin main
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            # Health check
            sleep 10
            curl -f http://localhost:3000/health || exit 1
```

### Deployment Strategy
```
┌─────────────────────────────────────────┐
│           DEPLOYMENT FLOW               │
├─────────────────────────────────────────┤
│                                         │
│  Developer Push ──► GitHub Actions      │
│       │                                 │
│       ├── develop branch ──► Staging    │
│       │                                 │
│       └── main branch ──► Production    │
│             │                           │
│             ├── Build Docker images     │
│             ├── Run migrations          │
│             ├── Rolling restart (PM2)   │
│             ├── Health check            │
│             └── Notify (Telegram/Slack) │
│                                         │
│  Rollback: docker compose up -d (prev) │
│                                         │
└─────────────────────────────────────────┘
```


---

## 📊 13. Monitoring & Logging

### Stack: Prometheus + Grafana + Loki

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  NestJS App  │────►│  Prometheus  │────►│   Grafana    │
│  (Metrics)   │     │  (Collect)   │     │  (Dashboard) │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  NestJS App  │────►│    Loki      │────►│   Grafana    │
│  (Pino Logs) │     │  (Aggregate) │     │  (Explore)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Key Metrics to Monitor
| Metric | Alert Threshold |
|--------|----------------|
| API Response Time (p95) | > 500ms |
| Error Rate (5xx) | > 1% |
| Scraper Success Rate | < 95% |
| Redis Memory Usage | > 80% |
| MariaDB Connections | > 80% pool |
| Queue Job Backlog | > 100 jobs |
| CPU Usage | > 80% sustained |
| Memory Usage | > 85% |
| Disk Usage | > 90% |
| SSL Certificate Expiry | < 14 days |

### Structured Logging Format (Pino)
```json
{
  "level": "info",
  "time": "2026-05-21T10:00:00.000Z",
  "pid": 1234,
  "hostname": "mlbb-api-1",
  "module": "scraper",
  "action": "scrape_complete",
  "source": "mlbb-official",
  "duration_ms": 3456,
  "records_affected": 25,
  "request_id": "uuid-v4",
  "msg": "Hero data scrape completed successfully"
}
```

---

## 🌍 14. SEO Strategy (Next.js)

### Technical SEO
1. **Server-Side Rendering (SSR)** - All hero/item pages rendered server-side
2. **Static Generation (SSG)** - Tier list, hero list pages pre-generated
3. **Incremental Static Regeneration (ISR)** - Revalidate every 5-30 minutes
4. **Structured Data (JSON-LD)** - Schema.org markup for hero/item pages
5. **Sitemap.xml** - Auto-generated, updated on data changes
6. **robots.txt** - Proper crawl directives
7. **Canonical URLs** - Prevent duplicate content
8. **Open Graph / Twitter Cards** - Rich social media previews
9. **Core Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1
10. **Mobile-First** - Responsive design, AMP consideration

### URL Structure
```
/heroes                          → Hero list
/heroes/fanny                    → Hero detail (SSR)
/heroes/fanny/counters           → Counter page
/heroes/fanny/builds             → Build guide
/counter/fanny                   → Counter finder
/items                           → Item list
/items/blade-of-despair          → Item detail
/tier-list                       → Current tier list
/tier-list/mythic                → Mythic tier list
/combos                          → Combo list
/stats                           → Statistics overview
/stats/winrate                   → Winrate ranking
```

### Meta Tags Strategy
```tsx
// Dynamic meta per hero page
export async function generateMetadata({ params }): Promise<Metadata> {
  const hero = await getHero(params.slug);
  return {
    title: `${hero.name} Counter - MLBB Counter Hero Guide 2026`,
    description: `Best counters for ${hero.name} in Mobile Legends. Win rate ${hero.winrate}%, pick rate ${hero.pickrate}%. Tips, builds & strategies.`,
    keywords: `${hero.name} counter, MLBB ${hero.name}, Mobile Legends ${hero.name} counter pick`,
    openGraph: { ... },
  };
}
```

---

## 📈 15. Scalability Plan

### Phase 1: Single VPS (Current - 0 to 10K DAU)
```
Single VPS (4 CPU, 8GB RAM, 100GB SSD)
├── Nginx
├── NestJS (PM2 cluster mode, 2 instances)
├── Next.js (1 instance)
├── MariaDB (local)
├── Redis (local)
├── Scraper Worker (1 instance)
└── Monitoring (lightweight)
```

### Phase 2: Vertical Scale (10K - 50K DAU)
```
VPS Upgrade (8 CPU, 16GB RAM, 200GB SSD)
├── Nginx (optimized)
├── NestJS (PM2, 4 instances)
├── Next.js (2 instances)
├── MariaDB (optimized, read replicas)
├── Redis (dedicated, 2GB)
├── Scraper Worker (dedicated)
└── Full monitoring stack
```

### Phase 3: Horizontal Scale (50K+ DAU)
```
┌─────────────────────────────────────────┐
│            CLOUDFLARE                    │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ App 1  │  │ App 2  │  │ App 3  │  ← NestJS instances
└────────┘  └────────┘  └────────┘
    │            │            │
    └────────────┼────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│MariaDB │  │ Redis  │  │ Worker │
│Primary │  │Cluster │  │  Pool  │
│+Replica│  │        │  │        │
└────────┘  └────────┘  └────────┘
```

### Database Scaling Strategy
1. **Read Replicas** - Separate read/write traffic
2. **Connection Pooling** - PgBouncer equivalent for MariaDB (ProxySQL)
3. **Table Partitioning** - hero_stats by date (monthly partitions)
4. **Archiving** - Move old stats to archive tables yearly
5. **Query Optimization** - Explain analyze, proper indexing

---

## 💰 16. Server Resource Estimation

### Minimum Production (Phase 1)
| Resource | Spec | Monthly Cost (est.) |
|----------|------|---------------------|
| VPS | 4 vCPU, 8GB RAM, 100GB NVMe | $30-50/mo |
| Redis | In-VPS, 512MB allocated | Included |
| MariaDB | In-VPS, dedicated 2GB | Included |
| Cloudflare | Free/Pro plan | $0-20/mo |
| Domain | .com | $12/year |
| Proxy Pool | Rotating (for scraper) | $20-50/mo |
| **Total** | | **$60-130/mo** |

### Recommended Production (Phase 2)
| Resource | Spec | Monthly Cost (est.) |
|----------|------|---------------------|
| VPS | 8 vCPU, 16GB RAM, 200GB NVMe | $60-100/mo |
| Redis | Dedicated 2GB | $10-20/mo or included |
| MariaDB | Optimized, backup VPS | $20-40/mo |
| Cloudflare Pro | WAF + Advanced | $20/mo |
| Monitoring | Grafana Cloud (free tier) | $0 |
| Proxy Pool | Premium rotating | $50-100/mo |
| **Total** | | **$160-280/mo** |


---

## 🗺️ 17. Development Roadmap

### Phase 1: Foundation (Week 1-3)
- [x] Architecture design & documentation
- [ ] Setup monorepo (Turborepo)
- [ ] Setup Docker development environment
- [ ] MariaDB schema & migrations (Prisma)
- [ ] NestJS project scaffolding
- [ ] Core modules: Heroes, Items, Spells
- [ ] Redis cache integration
- [ ] Basic API endpoints (CRUD)
- [ ] API authentication (API Key + JWT)
- [ ] Rate limiting middleware

### Phase 2: Scraping Engine (Week 3-5)
- [ ] Playwright scraper setup
- [ ] Hero data scraper
- [ ] Item data scraper
- [ ] Stats scraper (winrate/pickrate)
- [ ] BullMQ queue integration
- [ ] Cron scheduler setup
- [ ] Scrape logging & monitoring
- [ ] Error handling & retry logic
- [ ] Data transformation pipeline
- [ ] Cache invalidation on update

### Phase 3: Advanced Features (Week 5-7)
- [ ] Counter hero logic & API
- [ ] Tier list generation algorithm
- [ ] Combo hero recommendation
- [ ] Build recommendation engine
- [ ] Statistics aggregation
- [ ] Search functionality (full-text)
- [ ] Admin panel backend
- [ ] API versioning (v1)

### Phase 4: Frontend Web (Week 7-9)
- [ ] Next.js project setup
- [ ] UI component library (Tailwind + shadcn/ui)
- [ ] Hero list & detail pages
- [ ] Counter finder page
- [ ] Tier list page
- [ ] Item & build pages
- [ ] Stats dashboard
- [ ] SEO optimization
- [ ] Admin panel UI

### Phase 5: Mobile App (Week 9-12)
- [ ] Flutter project setup
- [ ] API client & interceptors
- [ ] Hero list & detail screens
- [ ] Counter finder screen
- [ ] Tier list screen
- [ ] Offline cache (Hive/Isar)
- [ ] Push notifications
- [ ] App Store / Play Store submission

### Phase 6: Production & Polish (Week 12-14)
- [ ] Docker production setup
- [ ] Nginx configuration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring & alerting (Prometheus/Grafana)
- [ ] Load testing (k6)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation finalization

### Phase 7: Post-Launch (Ongoing)
- [ ] A/B testing
- [ ] Analytics integration
- [ ] User feedback loop
- [ ] Feature additions (meta report, patch analysis)
- [ ] Community features (comments, ratings)
- [ ] Monetization (ads, premium API)

---

## 🔀 18. Data Flow Diagrams

### User Request Flow
```
User Request ──► Cloudflare CDN
    │                │
    │ Cache HIT?  ───┤──► YES ──► Return cached response
    │                │
    │ Cache MISS ◄───┘
    │
    ▼
Nginx Reverse Proxy
    │
    ├── Rate limit check ──► EXCEEDED ──► 429 Too Many Requests
    │
    ▼
NestJS API Handler
    │
    ├── Auth check (API Key / JWT)
    │   └── INVALID ──► 401 Unauthorized
    │
    ├── Input validation (Zod/class-validator)
    │   └── INVALID ──► 400 Bad Request
    │
    ├── Redis cache check
    │   └── HIT ──► Return cached (add Cache-Hit header)
    │
    ▼
Service Layer (Business Logic)
    │
    ▼
Prisma ORM ──► MariaDB
    │
    ▼
Response Transformer
    │
    ├── Store in Redis cache (with TTL)
    │
    ▼
JSON Response ──► Client
```

### Auto-Update Flow
```
Cron Trigger (every N hours)
    │
    ▼
BullMQ: Add scrape job to queue
    │
    ▼
Worker picks up job
    │
    ├── Check: Is source accessible?
    │   └── NO ──► Retry (exponential backoff) ──► Alert admin
    │
    ▼
Playwright/HTTP fetches data
    │
    ▼
Data Transformer
    │
    ├── Compare with existing data
    │   └── NO CHANGE ──► Log "no update needed" ──► Done
    │
    ▼
Upsert to MariaDB (transaction)
    │
    ├── Invalidate related Redis cache keys
    ├── Log to scrape_logs table
    ├── Notify admin (if significant change)
    │
    ▼
Done (data available on next request)
```

---

## 🔑 19. Environment Variables

```env
# .env.example

# App
NODE_ENV=production
APP_PORT=3000
APP_URL=https://api.mlbb-counter.com
FRONTEND_URL=https://mlbb-counter.com

# Database
DATABASE_URL=mysql://user:password@host:3306/mlbb_counter
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://:password@host:6379/0
REDIS_CACHE_DB=0
REDIS_QUEUE_DB=1

# Auth
JWT_SECRET=<random-64-char>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
API_KEY_SALT=<random-32-char>

# Scraper
SCRAPER_PROXY_URL=http://proxy:port
SCRAPER_MAX_CONCURRENCY=3
SCRAPER_TIMEOUT_MS=30000
SCRAPER_USER_AGENT=Mozilla/5.0 ...

# Cloudflare
CF_API_TOKEN=<token>
CF_ZONE_ID=<zone-id>

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_URL=http://localhost:3002

# Notifications
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat-id>

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## ✅ 20. Summary & Recommendations

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Framework | NestJS | TypeScript, modular, enterprise-grade, great ecosystem |
| Database | MariaDB + Prisma | Existing infra, type-safe ORM, migrations |
| Cache | Redis (multi-layer) | Fast, versatile, queue support |
| Frontend | Next.js 15 (App Router) | SEO, SSR/SSG, React ecosystem |
| Mobile | Flutter + Riverpod | Cross-platform, offline-first capable |
| Scraper | Playwright + BullMQ | Reliable, stealth, queue-based |
| Deploy | Docker + PM2 + Nginx | Existing infra compatible, production-ready |
| Monitoring | Prometheus + Grafana | Industry standard, free |
| CI/CD | GitHub Actions | Integrated with repo, free tier |
| CDN/WAF | Cloudflare | DDoS protection, edge caching, free tier |

### Critical Success Factors
1. **Reliable Scraping** - Data freshness is the core value proposition
2. **Fast API Response** - < 100ms cached, < 300ms uncached
3. **SEO Dominance** - Rank for "MLBB counter [hero_name]" keywords
4. **Mobile Experience** - Smooth, offline-capable Flutter app
5. **Data Accuracy** - Validate scraped data, cross-reference sources
6. **Uptime** - 99.9% availability target

### Next Steps After Approval
1. Initialize monorepo with Turborepo
2. Setup NestJS backend with core modules
3. Create Prisma schema & run migrations
4. Implement basic CRUD endpoints
5. Setup Redis caching layer
6. Build first scraper (hero data)
7. Setup Docker development environment
8. Deploy MVP to staging

---

*Document created: 2026-05-21*
*Version: 1.0*
*Status: AWAITING APPROVAL*
