# 📂 Project Structure

This document provides a detailed breakdown of the **CampusConnect** codebase, organized by responsibility and layer.

## Project Root

| File / Directory | Purpose |
| :--- | :--- |
| `pom.xml` | Maven configuration, dependencies, and build settings |
| `Dockerfile` | Multi-stage Docker build (build + runtime) |
| `docker-compose.yml` | Full-stack local development (MySQL + App) |
| `run_app.ps1` / `stop_app.ps1` | PowerShell convenience scripts for local dev |
| `README.md` | Project overview, setup, and deployment guide |
| `TECHNICAL_GUIDE.md` | In-depth architecture and implementation details |
| `CONTRIBUTING.md` | Contributor workflow and guidelines |
| `SECURITY.md` | Responsible disclosure policy |
| `LICENSE` | MIT License |

---

## 📦 Backend (`src/main/java/com/tejaswin/campus`)

The Java source code follows a clean 3-tier architecture:

### 🧩 Models (`/model`)

Entities representing the database schema.

- `User.java` — Admin and Student users with role-based access.
- `Event.java` — Main event entity (title, date, venue, category, image, capacity).
- `Registration.java` — Links users to events for interest tracking and analytics.

### 💾 Repositories (`/repository`)

JPA interfaces for database communication.

- `UserRepository.java` — User queries and lookups.
- `EventRepository.java` — Event CRUD and filtered queries.
- `RegistrationRepository.java` — Registration tracking and analytics.

### ⚙️ Services (`/service`)

Business logic layer.

- `EventService.java` — CSV exports, image handling, N+1 query optimization, event registration.
- `UserService.java` — User authentication, role management, BCrypt hashing.
- `RegistrationService.java` — Event registration logic with circuit breaker resilience.

### 🎮 Controllers (`/controller`)

HTTP request handlers.

- `AuthController.java` — Login/Logout for Students and Admins.
- `EventController.java` — Student Dashboard and event engagement.
- `AdminController.java` — Admin Dashboard (CRUD, Analytics, CSV Exports).

### 🔒 Security (`/security`)

- `SecurityConfig.java` — Spring Security filter chain, CSRF, session, and role-based access configuration.
- `RateLimitingFilter.java` — Bucket4j-based rate limiting for login endpoints.

### 🛠️ Configuration (`/config`)

- `WebMvcConfig.java` — Static resource paths for external file access (uploads).
- `CacheConfig.java` — Caffeine cache configuration.
- `ResilienceConfig.java` — Resilience4j circuit breaker setup.
- `OpenApiConfig.java` — Swagger/OpenAPI documentation configuration.

### ⚠️ Exception Handling (`/exception`)

- `GlobalExceptionHandler.java` — Centralized error handling (file size limits, 404s, general errors).
- `EventNotFoundException.java` — Custom exception for missing events.
- `RegistrationException.java` — Custom exception for registration failures.

### 🚀 Application Entry Point

- `CampusEventManagerApplication.java` — Spring Boot main class.

---

## 🎨 Frontend & Resources (`src/main/resources`)

### 🏙️ Templates (`/templates`)

Thymeleaf HTML templates with dynamic content:

| Template | Purpose |
| :--- | :--- |
| `dashboard.html` | Student-facing event listing and interaction |
| `admin_dashboard.html` | Admin management console with real-time analytics |
| `admin_login.html` | Secure administrative login page |
| `event_detail.html` | Individual event detail view |
| `error.html` | Polished, animated error fallback page |

### 🛠️ Static Assets (`/static`)

- `css/style.css` — Core design system (Glassmorphism, Dark Theme, Micro-Animations).
- `js/main.js` — Frontend logic for search, filtering, and Chart.js integration.
- `favicon.svg` — Application favicon.
- `manifest.json` & `sw.js` — Progressive Web App (PWA) configuration for offline support and mobile install.

### 📝 Configuration

- `application.properties` — Server port, database, session, Flyway, Resilience4j, and upload settings.

### 🗂️ Database Migrations (`/db/migration`)

- Flyway `.sql` scripts for deterministic schema versioning.

---

## 🧪 Tests (`src/test/java`)

- `EventServiceTest.java` — JUnit 5 / Mockito suites verifying critical business logic without a live database.

---

## 🔧 CI/CD (`.github`)

- `workflows/ci.yml` — GitHub Actions CI pipeline (build + test with MySQL service container).
- `ISSUE_TEMPLATE/` — Bug report and feature request templates.
- `PULL_REQUEST_TEMPLATE.md` — Standardized PR checklist.
