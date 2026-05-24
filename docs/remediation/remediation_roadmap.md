# Comprehensive Security & Architecture Remediation

## Phase 1: Critical Security Fixes (P0)
- [x] 1. Dependencies: Verify `pom.xml` (Spring Boot 3.4.2, Security, Bucket4j 8.7.0).
- [x] 2. Session Security: Verify `application.properties` (http-only, secure, same-site, tracking-modes).
- [x] 3. CSRF Protection:
    - [x] Verify `SecurityConfig.java` (FilterChain, TokenRepository).
    - [ ] Audit all `.html` templates for `_csrf` hidden field injection.
- [x] 4. Rate Limiting: Refine `RateLimitingFilter.java` (IP extraction, 429 status, 5req/15min).
- [x] 5. Auth Defenses:
    - [x] `AuthController.java`: `@Size` constraints and manual length check.
    - [x] `UserService.java`: Constant-time execution with dummy hash.
- [x] 6. Race Conditions:
    - [x] `UserRepository.java`: `findByUsernameForUpdate` with pessimistic lock.
    - [x] `DataInitializer.java`: `@Transactional` and lock usage.

## Phase 2: High-Priority Fixes (P1)
- [x] 7. File Upload & Resource Leaks:
    - [x] `AdminController.java`: UUID generation, symlink checks (`NOFOLLOW_LINKS`).
    - [x] `editEvent()`: Try-catch block with cleanup on DB failure.
- [x] 8. Concurrency & Session TOCTOU:
    - [x] `AdminController.java`: `@Transactional(readOnly = true)` for dashboard.
    - [x] `AuthController.java`: `synchronized` block for session invalidation.
- [x] 9. DB Constraints & Flyway:
    - [x] `User.java`: Bounded password constraints.
    - [x] `Event.java`: `@Pattern` for registration links.
    - [x] `Registration.java`: Unique constraint (`user_id`, `event_id`).
    - [x] Flyway: Configure dependencies and `V1__Initial_Schema.sql`.

## Phase 3: Quality, Resilience & Testing (P2)
- [x] 10. Resilience & Reliability:
    - [x] `pom.xml`: Add Resilience4j.
    - [x] `EventController.java`: `@CircuitBreaker` and fallback logic.
    - [ ] URL Validation: `@Cacheable` URL validation with timeout.
- [x] 11. Architectural Refactoring:
    - [x] `SessionService.java`: Abstract `HttpSession` interactions.
    - [x] `AppConfig.java`: Type-safe properties for magic numbers.
    - [x] Update BCrypt strength to be environment-driven.
- [x] 12. Observability & Exceptions:
    - [x] `pom.xml`: Add Logstash encoder.
    - [x] `SecurityAuditLogger.java`: Structured logging with MDC.
    - [x] Exceptions: `EventNotFoundException`, `InvalidImageException` + Global Handler.
- [ ] 13. Test Suite:
    - [ ] `AdminControllerSecurityTest.java`: Comprehensive security scenarios.
    - [ ] `RegistrationRepositoryTest.java`: Integrity violation tests.

## Phase 4: Final Polish
- [x] 14. Professional README: Enhance with visuals and technical architecture sections.
