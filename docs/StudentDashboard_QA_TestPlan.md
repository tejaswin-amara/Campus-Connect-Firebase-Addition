# Student Dashboard Quality Assurance (QA) Test Plan

## 1. Objective
The goal of this test plan is to thoroughly evaluate the student dashboard to ensure it functions smoothly, is intuitive for users, displays accurate event data at all times, and maintains responsiveness across a wide range of devices and browsers.

## 2. Scope
This testing process covers:
- **Core Functionality:** Navigation, event filtering (Categories & Time), search, and viewing event details.
- **Data Accuracy:** Verification that event titles, descriptions, dates, and venues match the backend database.
- **Usability (UI/UX):** Assessing the ease of filtering, search responsiveness, and modal readability.
- **Responsiveness & Cross-Device Compatibility:** Ensuring the dashboard grid and detail modals render correctly on desktops, tablets, and smartphones.

## 3. Test Environment Setup
- **Browsers:** Chrome, Firefox, Safari, Edge (latest versions).
- **Devices:** Desktop, Tablet (Portrait/Landscape), Mobile.
- **Network Conditions:** Test loading states and image fallback behaviors.

---

## 4. Feature-Specific Test Cases

### 4.1. Navigation & Sidebar
- **Link Functionality:** Click "All Events", "Technical", "Cultural", etc. Verify the grid filters instantly without a full page reload if handled by JS.
- **Active States:** Verify the sidebar link for the selected category is highlighted.
- **Mobile Menu:** Verify the hamburger menu icon appears on mobile, opens the sidebar as an overlay, and closes when a selection is made or the overlay is clicked.

### 4.2. Event Discovery (Search & Filter)
- **Search Responsiveness:** Enter partial event titles or venues. Verify the grid updates in real-time.
- **Category Filtering:** Select a category (e.g., "Workshop"). Verify only matching cards are shown.
- **Time Filtering:** Select "Upcoming", "Ongoing", or "Past". Verify events are filtered correctly based on their date/time compared to "now".
- **Empty States:** search for a non-existent event. Verify the "No results" message appears.

### 4.3. Event Cards & Details
- **Card Metadata:** Verify cards show correct title, category badge, date, and venue.
- **Status Badges:** Confirm "Upcoming", "Ongoing", or "Past" badges on individual cards match the event date logic.
- **Detail Modal:** Click a card. Verify the modal opens with full details:
    - Large image (or fallback icon if missing).
    - Full description.
    - Meta grid (Date, Time, Venue).
    - "Add to Calendar" button functionality (ICS download).
    - "Register Now" button and QR code (if registration link exists).

### 4.4. Registration & External Links
- **Registration Tracking:** Click "Register Now". Verify it opens the external link in a new tab (optionally via the tracking endpoint `/student/register-external/{id}`).
- **QR Code View:** Verify the QR code matches the registration link and is scannable by mobile devices.

---

## 5. Cross-Functional & System Testing

### 5.1. Performance & Loading
- **Image Fallbacks:** Intentionally use an event with a broken image URL. Verify the broken image is replaced by a professional placeholder.
- **Loading Skeleton/Animation:** Verify "animate-in" classes provide smooth transitions when filtering or loading.

### 5.2. Responsiveness
- **Grid Layout:** 1 column on mobile, 2 on tablet, 3+ on desktop.
- **Detail Modal:** On mobile, verify the modal fits the screen and allows internal scrolling for descriptions.

### 5.3. Technical Health
- **Console Monitoring:** Ensure no parsing errors (e.g., `manifest.json`) or 404s for static assets.
- **SEO & Meta Tags:** Verify OpenGraph tags and page titles are correctly set in the `<head>`.

