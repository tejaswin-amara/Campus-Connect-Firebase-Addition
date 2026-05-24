# 📘 CampusConnect — Technical Guide

Welcome to the technical documentation for the CampusConnect application. This guide provides an in-depth look at the architecture, key components, and implementation details.

## 1. Architecture Overview 🏗️

The application follows a standard **Model-View-Controller (MVC)** architecture using the Spring Boot framework.

### Layered Structure

- **Presentation Layer (View):** Thymeleaf HTML templates with custom CSS (Glassmorphism design system) and vanilla JavaScript.
- **Control Layer (Controller):** Spring MVC Controllers (`EventController`, `AdminController`, `AuthController`) handling HTTP requests and routing.
- **Service Layer (Service):** Business logic encapsulation (`EventService`, `UserService`).
- **Data Access Layer (Repository):** Spring Data JPA Repositories (`EventRepository`, `UserRepository`, `RegistrationRepository`).
- **Database Layer:** MySQL 8.x with Flyway-managed schema migrations.

## 2. Technology Stack 💻

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot | 3.4.2 |
| **Language** | Java | 21 (LTS) |
| **Database** | MySQL | 8.0+ |
| **ORM** | Hibernate (via Spring Data JPA) | — |
| **Frontend Engine** | Thymeleaf | — |
| **Styling** | Custom CSS (Glassmorphism, Dark Theme) | — |
| **Charts** | Chart.js | Latest |
| **Icons** | Bootstrap Icons | 1.11.3 |
| **Build Tool** | Maven (Wrapper) | — |
| **Code Coverage** | JaCoCo | 0.8.12 |

## 3. Key Features & Implementation Details 🔍

### 3.1 Event Management (CRUD)

- **Create:** Admins create events with title, description, venue, category, dates, and images.
- **Read:**
  - *Student Dashboard:* Displays events with filtering by category and status (Upcoming/Ongoing/Past).
  - *Admin Dashboard:* Comprehensive table view with search, filter, and pagination.
- **Update:** Full edit capability for event details and images.
- **Delete:** Hard delete removes the event and its associated image file from disk.

### 3.2 Image Handling

- **Storage:** Images are stored on the local file system under `uploads/`.
- **Serving:** Spring Boot resource handler maps `/uploads/**` to the file system directory.
- **Security:** Upload logic is isolated in `EventService.java` — blocks path traversal, applies UUID filenames, and enforces extension whitelists (`jpg`, `png`, `webp`, `gif`).
- **Cleanup:** `EventService.deleteEvent()` automatically deletes the corresponding image file to prevent orphans.

### 3.3 Data Integrity & Validation

- **Date Logic:** The system enforces `End Date > Start Date` validation.
- **Input Safety:** Input sanitization handled via Spring MVC binding and Bean Validation.

### 3.4 Frontend Experience

- **Instant Filters:** Custom JavaScript provides client-side category/status filtering without page reloads.
- **Animations:** CSS3 animations with staggered delays for smooth loading experiences.
- **Glassmorphism:** Consistent design language using semi-transparent backgrounds and backdrop blur.

## 4. Security Architecture 🛡️

The application implements a "Security by Design" approach following a comprehensive security audit.

### 4.1 Authentication & Authorization

- **BCrypt Hardening:** Passwords hashed with BCrypt (strength 12). The authentication service includes a constant-time dummy execution path to prevent username enumeration via timing attacks.
- **Session Management:** On successful login, existing sessions are invalidated and new ones created to prevent session fixation.
- **Role-Based Access:** Enforced via Spring Security filters requiring `hasRole('ADMIN')` for all management endpoints.

### 4.2 Traffic & Forgery Control

- **Rate Limiting:** `RateLimitingFilter` (Bucket4j) throttles login attempts to 5 requests per 15 minutes per IP.
- **CSRF Protection:** All POST/PUT/DELETE forms include a `_csrf` token validated server-side.

### 4.3 Database & Concurrency

- **Schema Migrations:** Managed via Flyway for consistent environments.
- **Race Condition Prevention:** Pessimistic write locks during critical data initialization.
- **Transactional Integrity:** Strict `@Transactional` boundaries ensure atomic updates and snapshot isolation.

## 5. Database Schema 🗄️

### `User` Table

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto-generated |
| `username` | String (Unique) | — |
| `password` | String | BCrypt hashed |
| `role` | String | `ADMIN` or `STUDENT` |

### `Event` Table

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto-generated |
| `title` | String | — |
| `description` | Text | — |
| `dateTime` | DateTime | Start date/time |
| `endDateTime` | DateTime (Nullable) | End date/time |
| `venue` | String | — |
| `category` | String | — |
| `imageUrl` | String | Path to uploaded image |
| `registrationLink` | String | External registration URL |
| `maxCapacity` | Integer | — |

### `Registration` Table

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto-generated |
| `user_id` | Long (FK) | References `User` |
| `event_id` | Long (FK) | References `Event` |

## 6. Deployment & Setup 🚀

### Local Development

The `run_app.ps1` PowerShell script handles the full lifecycle:

1. **Database Check:** Ensures the MySQL service is running.
2. **Build:** Uses Maven Wrapper to compile the application.
3. **Run:** Starts the application on port `9090`.

### Docker

```bash
docker compose up -d
```

This spins up both MySQL and the application. See the [README](README.md) for full Docker and Railway deployment instructions.

### Production Considerations

- Override `ADMIN_PASSWORD` with a strong password.
- Set `LOG_LEVEL=INFO` or `WARN` for production.
- Configure `useSSL=true` and `allowPublicKeyRetrieval=false` for database connections.
- Use a persistent volume for the `uploads/` directory.
