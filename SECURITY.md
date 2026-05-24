# 🔐 Security Policy

## Supported Versions

| Version | Supported |
| :--- | :---: |
| Latest (`main` branch) | ✅ |
| Older releases | ❌ |

## Reporting a Vulnerability

If you discover a security vulnerability in CampusConnect, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainer directly:

- **Contact:** Tejaswin Amara
- **Email:** TejaswinAmara1@duck.com
- **Subject line:** `[SECURITY] CampusConnect — <brief description>`
### What to Include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix and disclosure:** Coordinated with the reporter

## Security Measures

This project implements the following security measures:

- BCrypt password hashing (strength 12) with timing attack mitigation
- CSRF protection on all state-changing operations
- Rate limiting on login endpoints (Bucket4j)
- Session fixation prevention
- Strict cookie policies (`HttpOnly`, `Secure`, `SameSite=Strict`)
- File upload validation (MIME check, extension whitelist, UUID filenames)
- Pessimistic locking for concurrent data access

For full details, see the [Technical Guide](TECHNICAL_GUIDE.md#4-security-architecture-%EF%B8%8F).
