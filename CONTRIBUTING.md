# 🤝 Contributing to CampusConnect

Thank you for your interest in contributing to **CampusConnect**! We value the participation of our student community and contributors in making this a world-class campus event management ecosystem.

---

## 🧭 How to Get Started

Before you start contributing, please ensure you have:
1. **Searched the [Issue Tracker](../../issues)** to check if the bug or feature request has already been reported.
2. **Read the [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)** to understand the project architecture and development workflow.

---

## 🛠️ Development Workflow

### 1. Fork and Clone
Fork the repository and clone it to your local machine:
```bash
git clone https://github.com/tejaswin-amara/campus-connect.git
cd campus-connect
```

### 2. Create a Topic Branch
Always develop your features or fixes in a separate branch:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Setup and Testing
Ensure your environment is set up according to the [README.md](./README.md). Before making changes, verify that the existing test suite passes:
```bash
./mvnw clean test
```

### 4. Code Standards & Style
- Follow standard Java coding conventions.
- Maintain a **mobile-first** approach for any UI changes.
- Ensure all new logic is covered by unit tests.

---

## 📤 Submitting Changes

### Open a Pull Request
Once you are finished with your changes:
1. Push your branch to GitHub.
2. Open a Pull Request (PR) against the `main` branch.
3. Use the provided **Pull Request Template** to describe your changes.
4. Ensure the **GitHub Actions CI** build passes for your PR.

> **Note:** Link your PR to a specific issue using keywords like `Closes #123` or `Fixes #456` in the description.

---

## ⚖️ Code of Conduct
By participating in this project, you agree to abide by our community standards and treat all contributors with respect and professionalism.

Thank you for making **CampusConnect** better for everyone! ❤️
