# BLACKOUT — Premium Apple-Inspired UI/UX Implementation Master Prompt

## 1. YOUR ROLE

Act as a world-class:

- Principal Product Designer
- Senior UI/UX Designer
- Frontend Architect
- Interaction Designer
- Motion Graphics Designer
- GSAP Animation Specialist
- Accessibility Engineer
- Performance Engineer
- Quality Assurance Engineer

Your task is to transform the existing **Blackout** project into a polished, premium, production-quality web experience.

You are working inside an existing codebase. First inspect the entire project, understand its architecture, identify its existing functionality, and then implement the redesign.

Do not simply create a visual mockup. Build a fully functional product with working interactions, real data, responsive layouts, smooth animations, and reliable user feedback.

---

# 2. PRODUCT CONTEXT — BLACKOUT

**Product name:** Blackout

**Product category:** Cybersecurity / Data Privacy / PII Detection and Sanitization

### The problem

People and organizations frequently share sensitive information through:

- Application logs
- Customer support tickets
- Resumes
- Text documents
- CSV exports
- Internal reports
- Other text-based records

Sensitive information can accidentally be exposed when documents are shared without proper redaction.

### The solution

Blackout is a privacy-first PII detection and text sanitization application.

It detects supported sensitive information and allows users to sanitize their documents directly inside their browser.

### Core product promise

**Your data stays yours.**

- Process text locally in the browser.
- Do not upload documents to a backend.
- Do not send sensitive content to external AI APIs.
- Do not use analytics or tracking services.
- Do not store original documents remotely.

### Existing detection capabilities

Preserve the existing detection engine and its functionality:

1. Email addresses
2. Credit card numbers with Luhn validation
3. Aadhaar numbers with Verhoeff validation
4. PAN numbers with holder-code validation
5. Indian mobile numbers and heuristic international phone detection
6. IPv4 addresses
7. Full eight-group IPv6 addresses

Compressed IPv6 formats such as `::1` are not currently supported.

### Existing redaction modes

- Full redaction: `[REDACTED]`
- Partial masking
- Consistent pseudonymization within one document

### Existing application features

- Text input
- TXT and CSV import through the browser File API
- Maximum upload size of 5 MB
- Built-in fictional sample data
- Detection counts
- Highlighted sensitive information
- Original versus sanitized comparison
- Copy sanitized content
- Download sanitized TXT and CSV
- Audit log limited to the first 500 findings

Preserve these features and connect every redesigned interface to the real existing application logic.

Do not invent additional detection capabilities.

---

# 3. DESIGN DIRECTION — APPLE-INSPIRED PREMIUM EXPERIENCE

## Primary visual reference

Use the design philosophy and interaction quality of Apple's official website:

https://www.apple.com/

Study the following design principles:

- Large editorial typography
- Generous negative space
- Clear visual hierarchy
- Minimalist navigation
- Premium product presentation
- Elegant transitions
- Cinematic scroll-based storytelling
- Restrained use of color
- Beautiful product-focused sections
- Carefully designed micro-interactions
- Consistent spacing and alignment
- Responsive layouts

**Important:** Use Apple as a design inspiration, not as a template to copy.

Do not reproduce Apple's exact layouts, branding, product imagery, logos, text, or proprietary assets.

Create an original Blackout visual identity.

## Overall visual personality

Blackout should feel:

- Premium
- Minimal
- Modern
- Technological
- Secure
- Professional
- Calm
- Trustworthy
- Precise

Avoid making the application look like a generic admin dashboard, a template website, or an ordinary cybersecurity landing page.

The interface should communicate that Blackout is a carefully engineered privacy product.

---

# 4. DESIGN SYSTEM

## Color palette

Use a restrained monochromatic palette with carefully selected accent colors.

### Light theme

- Main background: `#F5F5F7`
- Primary surface: `#FFFFFF`
- Primary text: `#1D1D1F`
- Secondary text: `#6E6E73`
- Subtle borders: `#D2D2D7`
- Primary accent: `#2563EB`
- Success: `#16834A`
- Warning: `#B7791F`
- Error: `#D93025`

### Dark theme

- Main background: `#09090B`
- Primary surface: `#141417`
- Secondary surface: `#1C1C20`
- Primary text: `#F5F5F7`
- Secondary text: `#A1A1AA`
- Subtle borders: `#303036`
- Primary accent: `#6EA8FE`

Use accent colors sparingly.

Do not use excessive gradients, neon colors, bright glows, or unnecessary decorative effects.

## Typography

Use a refined typography system.

Preferred font stack:

- Inter
- Manrope
- System UI
- Apple system font fallbacks

Use the existing Manrope dependency if it is already integrated.

Typography hierarchy:

- Hero heading: 64–88px on large screens
- Section heading: 40–56px
- Subheading: 22–28px
- Card heading: 18–22px
- Body: 15–18px
- Supporting text: 13–14px

Use responsive typography with `clamp()`.

Headings should be bold, readable, and carefully spaced.

Avoid excessive uppercase text.

## Layout

- Maximum content width: approximately 1200–1320px
- Consistent horizontal padding
- Large section spacing
- Balanced content alignment
- Clean grid layouts
- Subtle separators
- Consistent corner radii
- Minimal shadows

Use negative space intentionally.

Do not overcrowd the interface.

## Glassmorphism

Use the supplied GlassyDashboard component as a reusable visual foundation where appropriate.

Use:

- Subtle backdrop blur
- Translucent surfaces
- Fine borders
- Soft layered shadows
- Carefully controlled transparency

Glass effects should improve visual depth, not reduce readability.

Avoid applying blur to every element.

---

# 5. WEBSITE INFORMATION ARCHITECTURE

Build a coherent website and application experience.

Do not introduce unnecessary pages or complicated navigation.

## Recommended routes

### `/` — Landing page

Purpose: Explain Blackout and introduce the product.

### `/app` — Main application

Purpose: Let users detect and sanitize sensitive information.

### `/privacy` — Privacy information

Purpose: Explain browser-only processing, data handling, and product limitations.

### `/404` — Custom not-found page

Purpose: Provide a useful recovery experience.

If the existing project uses a different routing architecture, preserve it and adapt these routes accordingly.

Do not rebuild the application routing system unnecessarily.

---

# 6. LANDING PAGE — CINEMATIC PRODUCT STORYTELLING

The landing page should feel like a premium technology product launch.

Use Apple-inspired storytelling techniques while maintaining an original Blackout identity.

## Section 1 — Premium navigation

Create a minimal sticky navigation bar.

Left:

- Blackout logo and wordmark

Center or right:

- Product
- How it works
- Privacy
- FAQ

Primary CTA:

- Open Blackout

Requirements:

- Transparent navigation initially.
- Subtle background blur when scrolling.
- Smooth active states.
- Clickable logo returning to the homepage.
- Mobile hamburger menu.
- Smooth mobile menu opening and closing.
- Close menu after selecting a navigation item.
- Keyboard-accessible navigation.

## Section 2 — Hero

Create a visually striking hero section.

Suggested headline:

**Your data deserves privacy.**

Supporting headline:

Detect sensitive information. Sanitize your documents. Keep your data on your device.

Supporting description:

Blackout helps you identify and redact sensitive information directly in your browser, without uploading your documents to a server.

Primary CTA:

**Start protecting your data**

Secondary CTA:

**Explore how it works**

Hero visual:

Create an elegant interactive product preview.

Show a realistic Blackout workspace containing:

- Sample fictional text
- Highlighted PII findings
- Detection count indicators
- Sanitized preview
- A subtle privacy status indicator

The preview must use fictional data only.

Do not expose actual sensitive information.

### Hero animation

On initial page load:

1. Navigation fades into view.
2. Hero heading appears with a subtle upward reveal.
3. Supporting text fades in.
4. CTA buttons appear with a staggered animation.
5. Product preview enters with a gentle scale and opacity transition.

Keep animations refined and smooth.

Avoid excessive bouncing, spinning, or dramatic movement.

## Section 3 — Privacy-first statement

Large editorial typography:

**Privacy shouldn't be an afterthought.**

Explain that Blackout processes supported content locally in the browser.

Create a visually engaging section with:

- Local processing
- No document uploads
- No external AI processing
- No remote document storage

Only make claims supported by the actual implementation.

## Section 4 — How it works

Present a simple three-step visual explanation.

### Step 1 — Add your document

Paste text or import a supported TXT or CSV file.

### Step 2 — Detect sensitive information

Blackout identifies supported PII patterns and highlights findings.

### Step 3 — Sanitize and export

Choose a redaction mode, inspect the result, and download the sanitized content.

Use three premium cards or a connected horizontal process layout.

Animate each step as it enters the viewport.

## Section 5 — Feature showcase

Present the real product features through large visual sections.

### Detection

Show supported detection categories and real detection results.

### Smart redaction

Explain full redaction, partial masking, and consistent pseudonymization.

### Document comparison

Show original and sanitized content side by side.

### Audit history

Explain how findings are summarized without exposing original sensitive values.

Use a mixture of typography, product screenshots or actual interface components, and subtle visual transitions.

Do not use fabricated statistics.

## Section 6 — Product preview

Create a large product showcase that transitions naturally into the actual Blackout application.

Use the real application components wherever possible.

CTA:

**Experience Blackout**

Link to `/app`.

## Section 7 — Privacy limitations

Include an honest, easy-to-understand explanation.

Blackout currently does not detect every form of personal information.

For example:

- Names
- Physical addresses
- Contextual or unstructured personal information

Detection results should not be presented as a guarantee of complete anonymization or regulatory compliance.

Explain that partially masked and pseudonymized content may still qualify as personal data.

## Section 8 — Final CTA

Headline:

**Take control of what you share.**

Description:

Identify sensitive information before it leaves your hands.

CTA:

**Open Blackout**

Use a restrained, premium visual treatment.

## Section 9 — Footer

Include:

- Blackout logo
- Product link
- Privacy link
- Contact link only if a genuine contact destination exists
- Copyright statement with the current year

Remove placeholder links and unused navigation.

---

# 7. MAIN APPLICATION — GLASSYDASHBOARD INTEGRATION

The provided `glassy-dashboard.tsx` is an existing React dashboard component.

It includes:

- Glass-style panels
- Sidebar/navigation
- Dashboard views
- Dialogs
- Theme handling
- GSAP animations
- Charts and metric displays
- CSV export functionality
- Responsive layout patterns

It was originally designed around an ATLAS business analytics workspace.

**Do not use the ATLAS content unchanged.**

Inspect the complete component before integration.

Reuse its useful design and interaction patterns, but transform its information architecture, labels, data, and actions into real Blackout functionality.

Suggested destination:

`components/ui/glassy-dashboard.tsx`

Use the project's existing directory structure if it differs.

## Remove all unrelated ATLAS functionality

Remove:

- Revenue analytics
- Business operations
- Orders
- Financial metrics
- Fake business charts
- Connected business systems
- Unrelated notifications
- Fake workflow records
- Unrelated sample data
- ATLAS branding

Do not leave unused code or irrelevant labels.

## Blackout dashboard structure

Create four main views.

### View 1 — Privacy Workspace

This is the primary workspace.

Include:

- Document input
- TXT/CSV import
- Built-in fictional sample
- Scan/detect action
- Detection results
- Redaction mode selector
- Original and sanitized comparison
- Copy sanitized text
- Download TXT
- Download CSV

The user should immediately understand how to start.

The main scan CTA must trigger the real detection engine.

Do not create a fake scan animation that pretends to process content.

### View 2 — Detection Insights

Display actual detection counts from the current document.

Categories:

- Email
- Credit card
- Aadhaar
- PAN
- Phone
- IPv4
- IPv6

Display:

- Total findings
- Category breakdown
- Current document summary
- Sanitization status

Use real application state.

Do not fabricate historical data, security scores, accuracy percentages, or detection metrics.

If no document has been scanned, show a useful empty state.

### View 3 — Audit Log

Display findings from the current document.

Requirements:

- Maximum 500 findings.
- Use safe references or category labels.
- Do not display original sensitive values.
- Do not expose sensitive values in console logs.
- Do not create a persistent server-side audit database.

Provide appropriate empty and populated states.

### View 4 — Settings & Privacy

Include:

- Redaction mode preferences
- Theme selection
- Local processing explanation
- Supported detection types
- Current limitations
- Privacy information

Do not create settings that have no functional implementation.

---

# 8. MOTION DESIGN — GSAP AND SCROLL ANIMATIONS

Animation quality is a major part of this redesign.

Use the existing GSAP setup where appropriate.

Use `gsap` and `@gsap/react` if they are already present. Install missing dependencies only when necessary.

Use GSAP ScrollTrigger for scroll-based animations where it improves the experience.

Avoid adding multiple animation libraries for the same purpose.

## A. Page entrance animations

Use a refined page-load sequence:

- Navigation fade-in
- Heading reveal
- Supporting text reveal
- CTA stagger
- Product preview scale-in

Use a consistent easing system.

Suggested durations:

- Small interaction: 150–220ms
- Button interaction: 180–250ms
- Card entrance: 400–650ms
- Hero entrance: 600–900ms
- Section transition: 450–750ms

## B. Scroll-triggered animations

Implement smooth scroll reveals.

Examples:

- Section headings reveal as they enter the viewport.
- Feature cards appear with staggered motion.
- Product previews fade and move upward slightly.
- Privacy statements reveal line by line where appropriate.
- Process steps appear sequentially.
- Product showcase elements animate into position.

Use ScrollTrigger with sensible start and end positions.

Do not animate every element.

Do not make users wait for content to become visible.

Keep all important information readable even when animations fail.

## C. Scroll-based product storytelling

For the landing page, create one premium product showcase with a restrained scroll-driven transition.

Possible interaction:

As the user scrolls through the product showcase:

1. The workspace preview enters the viewport.
2. The preview gently scales into focus.
3. Detection highlights appear.
4. The sanitized output becomes visible.
5. The section transitions naturally into the next content block.

Keep the animation lightweight.

Do not pin large sections for unnecessarily long scroll distances.

## D. Interactive buttons

Every clickable button should have polished interaction states.

Implement:

- Smooth hover transitions
- Subtle hover elevation
- Gentle scale feedback
- Clear active/pressed feedback
- Focus-visible styling
- Disabled styling
- Loading state
- Success feedback where applicable

For primary CTAs, use a subtle animated background or gradient shift only if it fits the design.

Buttons should feel responsive and premium.

Do not use distracting infinite animations.

## E. Interactive cards

Use subtle card interactions:

- Gentle hover lift
- Border color transition
- Soft shadow transition
- Icon movement where appropriate

Do not make cards look clickable unless they actually perform an action.

## F. Navigation animations

Implement:

- Smooth active navigation indicator
- Mobile menu transition
- Sticky header transition
- Smooth section scrolling
- Clear hover and focus states

## G. Dashboard transitions

When changing dashboard views:

- Fade out the previous view.
- Introduce the new view smoothly.
- Animate real metric values only when appropriate.
- Animate charts only when real data is available.
- Prevent layout jumping.

Use the existing GSAP animation patterns where suitable.

## H. Reduced motion

Respect:

`prefers-reduced-motion: reduce`

When reduced motion is enabled:

- Disable parallax.
- Disable scroll-driven movement.
- Remove large transforms.
- Avoid staggered entrances.
- Use immediate or very short transitions.
- Keep every interaction functional.

Animations must enhance the experience, never block it.

---

# 9. BUTTONS AND MICROINTERACTIONS

Every interactive element must perform its advertised action.

Implement and test:

- Open Blackout
- Start scan
- Import file
- Load sample
- Change redaction mode
- Copy sanitized text
- Download sanitized TXT
- Download sanitized CSV
- Change dashboard views
- Toggle theme
- Open and close dialogs
- Open mobile navigation
- Close mobile navigation
- Navigate to privacy information
- Return to homepage

### Feedback system

Display clear feedback for user actions.

Success examples:

- Scan completed.
- Sanitized text copied.
- File imported successfully.
- Sanitized document downloaded.

Error examples:

- Unsupported file format.
- File exceeds the 5 MB limit.
- No content to scan.
- Clipboard access unavailable.
- Sanitization failed.

Use elegant toast notifications or inline feedback.

Notifications should be accessible and should not cover important controls.

Do not show success messages before an action actually succeeds.

---

# 10. RESPONSIVE DESIGN

The experience must be designed intentionally for every screen size.

Test at:

- 320px
- 360px
- 375px
- 390px
- 420px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

### Mobile

- Replace desktop navigation with a working mobile menu.
- Stack hero content appropriately.
- Keep headings readable.
- Use full-width CTAs when appropriate.
- Convert dashboard sidebar navigation into a mobile-friendly navigation pattern.
- Stack original and sanitized content vertically.
- Make dialogs fit within the viewport.
- Prevent horizontal overflow.
- Ensure touch targets are at least 44×44px.
- Keep text readable without zooming.

### Tablet

- Use balanced two-column layouts where appropriate.
- Avoid compressed dashboard panels.
- Maintain proper navigation spacing.
- Keep charts and document comparison readable.

### Desktop

- Use spacious layouts.
- Maintain a maximum content width.
- Avoid excessively wide text blocks.
- Use multi-column feature sections where appropriate.

**Important:** Do not simply shrink the desktop design. Create a deliberate mobile experience.

---

# 11. WEBSITE QUALITY CHECKLIST

Implement and verify every item.

## Navigation and usability

- Remove horizontal scrolling.
- Fix broken links.
- Add working mobile navigation.
- Add favicon.
- Fix page titles.
- Add meta descriptions.
- Fix footer links.
- Add custom 404 page.
- Update copyright year automatically.
- Make logo clickable.
- Make phone and email links clickable only if real contact information exists.
- Remove unused navigation items.
- Remove placeholder text.
- Fix mobile overflow.
- Make every page responsive.

## Functional quality

- Fix broken buttons.
- Add success messages.
- Add error messages.
- Add loading states.
- Add empty states.
- Add disabled states.
- Validate file imports.
- Verify clipboard functionality.
- Verify download functionality.
- Verify dashboard navigation.
- Verify theme switching.

## Visual quality

- Consistent typography.
- Consistent spacing.
- Consistent border radii.
- Consistent colors.
- Consistent icon style.
- No random gradients.
- No excessive shadows.
- No unnecessary animations.
- No overlapping elements.
- No clipped content.
- No layout shifts.

---

# 12. SECURITY AND PRIVACY REQUIREMENTS

This is a privacy-focused product. The redesign must never compromise its core promise.

Preserve the browser-only architecture.

Do not add:

- Backend APIs
- Remote AI APIs
- Cloud document processing
- Analytics services
- Tracking scripts
- Third-party document uploads
- Cloud storage for user documents
- External services that receive document content

Avoid external images and unnecessary remote fonts.

Use local assets and existing project dependencies whenever possible.

### Sensitive data handling

- Never render user-provided content as unsafe HTML.
- Use safe React rendering.
- Do not log original document content.
- Do not include sensitive values in toast messages.
- Do not expose sensitive values in URLs.
- Do not persist original documents unnecessarily.
- Clear temporary data when the application workflow allows it.
- Ensure export operations use the actual sanitized content.

Keep the existing detection engine intact.

Do not replace validated detection logic with frontend-only mock functionality.

Do not claim that Blackout guarantees complete anonymization or regulatory compliance.

---

# 13. ACCESSIBILITY

Follow practical WCAG 2.2 AA principles.

Implement:

- Semantic HTML
- Correct heading hierarchy
- Keyboard navigation
- Visible focus states
- Accessible form labels
- Appropriate ARIA attributes
- Screen-reader-friendly notifications
- Sufficient color contrast
- Accessible dialogs
- Keyboard-operable menus
- Reduced-motion support
- Touch-friendly controls

Do not communicate detection status through color alone.

---

# 14. PERFORMANCE OPTIMIZATION

The website should feel fast and responsive.

Requirements:

- Optimize images.
- Use modern image formats where appropriate.
- Lazy-load below-the-fold images.
- Avoid unnecessary dependencies.
- Avoid repeated animation initialization.
- Clean up GSAP timelines and ScrollTriggers.
- Avoid expensive blur effects on large areas.
- Prevent unnecessary React re-renders.
- Avoid layout shifts.
- Optimize font loading.
- Keep animations GPU-friendly where possible.

Do not sacrifice performance for visual effects.

---

# 15. SEO AND METADATA

Add appropriate metadata for public pages.

Suggested homepage title:

`Blackout — Privacy-First PII Detection & Sanitization`

Suggested description:

`Detect and sanitize supported sensitive information directly in your browser. Keep your documents local with Blackout.`

Also implement:

- Page-specific titles
- Meta descriptions
- Open Graph metadata
- Favicon
- Appropriate theme color
- Semantic page structure

Do not add fake testimonials, fake customer logos, fake certifications, or unsupported security claims.

---

# 16. TECHNICAL IMPLEMENTATION RULES

Before making changes:

1. Inspect the existing repository.
2. Identify the frontend framework and version.
3. Identify the current routing system.
4. Identify the current design system.
5. Locate the Blackout detection engine.
6. Locate existing state management and file handling.
7. Inspect the complete `glassy-dashboard.tsx`.
8. Identify existing dependencies.
9. Identify existing components that can be reused.

Then create a short implementation plan and execute it.

### Existing component integration

Reuse the supplied GlassyDashboard component where appropriate.

Potential dependencies from the supplied component:

- `gsap`
- `@gsap/react`
- `lucide-react`
- `@fontsource-variable/manrope`

Check `package.json` before installing anything.

Do not duplicate installed dependencies.

Use the correct GSAP plugin registration and cleanup patterns.

Avoid conflicting global CSS.

Do not introduce a second application state system unless necessary.

Preserve the current working detection logic, validation, sanitization, file handling, and exports.

### Architecture principles

- Reusable components
- Centralized design tokens
- Clear component responsibilities
- Maintainable CSS
- Type-safe state
- Responsive layouts
- Clean route organization
- No unnecessary abstraction

Do not rewrite the entire project just to achieve the redesign.

---

# 17. FINAL QUALITY ASSURANCE

After implementation, test the complete application.

### Functional testing

Verify:

- Text input works.
- File import works.
- File-size validation works.
- File-type validation works.
- Detection works.
- All detection categories display correctly.
- All redaction modes work.
- Original and sanitized comparisons work.
- Copy works.
- TXT download works.
- CSV download works.
- Audit log works.
- Dashboard navigation works.
- Theme switching works.
- Mobile navigation works.
- Every CTA works.
- All internal links work.
- Custom 404 page works.

### Responsive testing

Test all specified screen sizes.

Fix:

- Horizontal overflow
- Broken grids
- Clipped content
- Overlapping buttons
- Unreadable text
- Dialog overflow
- Navigation issues

### Animation testing

Verify:

- Hero entrance animations
- Scroll-triggered reveals
- Button interactions
- Card interactions
- Dashboard transitions
- Mobile menu animation
- Reduced-motion behavior

Ensure that animations do not block scrolling or interaction.

### Privacy testing

Verify that normal document-processing workflows do not send document content to remote services.

Check network activity, application storage, console output, and export behavior.

Do not claim network isolation has been verified unless it has actually been tested.

### Build testing

Run the project's available:

- Production build
- TypeScript checks
- Linter
- Automated tests

Fix errors introduced by the redesign.

Do not hide failing tests or disable validation to make the build appear successful.

---

# 18. EXPECTED FINAL EXPERIENCE

The finished Blackout website should feel like a premium, modern technology product.

The landing page should communicate the product through elegant storytelling.

The application should make sensitive-data detection and sanitization simple.

The dashboard should feel refined, lightweight, and functional.

The animations should feel smooth, intentional, and responsive.

The mobile experience should be as carefully designed as the desktop experience.

The product must remain privacy-first and browser-only.

### Final design priorities

1. Premium Apple-inspired visual quality.
2. Excellent typography and spacing.
3. Smooth GSAP and scroll-triggered animations.
4. Beautiful interactive buttons and microinteractions.
5. Functional Blackout application.
6. Responsive mobile-first behavior.
7. Honest privacy communication.
8. Accessibility and performance.
9. Reliable production build.

---

# 19. FINAL EXECUTION INSTRUCTIONS

Do not stop after creating a plan or describing what should be changed.

Implement the redesign directly in the existing project.

Do not replace working features with static mockups.

Do not leave buttons that only look functional.

Do not use fake detection results.

Do not leave ATLAS branding or irrelevant business analytics.

Do not sacrifice the browser-only privacy architecture for visual convenience.

After implementation, provide a concise completion report containing:

1. Pages and components created or updated.
2. GlassyDashboard integration changes.
3. Design system and animation implementation.
4. Functional features verified.
5. Responsive screen sizes tested.
6. Accessibility improvements.
7. Build, lint, and test results.
8. Privacy and network behavior verified.
9. Remaining limitations or unresolved issues.

**Final objective: Build Blackout into a premium, Apple-inspired privacy product with cinematic scrolling, smooth motion, polished interactions, and a genuinely functional browser-only PII sanitization experience.**
