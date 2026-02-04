# Planning Guide

A comprehensive gym membership management and QR-based access control system that streamlines member check-ins, membership tracking, and administrative operations through an intuitive dashboard interface.

**Experience Qualities**:
1. **Efficient** - Quick access to critical information with minimal clicks, enabling rapid member verification and check-ins
2. **Professional** - Clean, trustworthy interface that inspires confidence in both gym staff and members
3. **Intuitive** - Clear visual hierarchy and familiar patterns that require minimal training for gym staff

**Complexity Level**: Light Application (multiple features with basic state)
The system manages multiple interconnected features (members, memberships, access control) with localStorage persistence, but remains focused on core gym operations without advanced integrations or complex business logic.

## Essential Features

**Admin Authentication**
- Functionality: Secure login for gym administrators
- Purpose: Protect sensitive member data and administrative functions
- Trigger: User navigates to root path or admin routes without authentication
- Progression: Enter credentials → Validate → Store session → Redirect to dashboard
- Success criteria: Only valid credentials grant access; invalid attempts show clear error messages

**Member Management (CRUD)**
- Functionality: Create, view, update member profiles with search/filter capabilities
- Purpose: Maintain comprehensive member database with contact info and membership status
- Trigger: Admin clicks "Clientes" in sidebar or "Nuevo cliente" button
- Progression: View list → Search/filter → Select member → View details → Edit/Update → Generate QR
- Success criteria: All member data persists correctly; search returns accurate results; QR codes generate unique identifiers

**Membership Assignment**
- Functionality: Assign and renew membership plans with payment tracking
- Purpose: Track active memberships and revenue while ensuring access control accuracy
- Trigger: Admin clicks "Asignar/Renovar membresía" from member detail page
- Progression: Select member → Choose plan → Enter payment details → Confirm → Update member status
- Success criteria: Membership expiration calculates correctly; member status updates automatically based on dates

**QR Access Control**
- Functionality: Verify member access via QR code scanning/input
- Purpose: Fast, automated check-in process with immediate status validation
- Trigger: Admin enters QR code in access control screen
- Progression: Input QR code → Validate member → Check status → Log access → Display result
- Success criteria: Valid members granted access; expired memberships denied with clear messaging; all attempts logged

**Digital Member Pass**
- Functionality: Public QR code display for members to show at entry
- Purpose: Provide members convenient access to their digital gym pass
- Trigger: Member opens personalized QR link on mobile device
- Progression: Navigate to /qr/:clientId → Display member info + QR code → Show at entry
- Success criteria: Mobile-optimized view; instant load; clear status indication; works offline after first load

**Admin Dashboard**
- Functionality: Overview of key metrics and recent activity
- Purpose: Quick health check of gym operations at a glance
- Trigger: Successful admin login
- Progression: Login → View metrics → Review recent check-ins → Navigate to detailed sections
- Success criteria: Metrics accurately reflect current data; recent activity shows latest entries

## Edge Case Handling

- **Empty States**: Friendly messages with clear CTAs when no members, no check-ins, or no memberships exist
- **Expired Memberships**: Clear visual indicators (red badges) and denial messages at access points
- **Invalid QR Codes**: Graceful error handling with suggestions to verify code or contact admin
- **Duplicate Members**: Validation prevents duplicate emails if provided
- **Missing Data**: Optional fields handled gracefully; required fields enforced with clear validation
- **Session Expiry**: Automatic logout with redirect to login if token missing or invalid

## Design Direction

The design should evoke **trust, efficiency, and energy** - combining the professional reliability of a business dashboard with the vibrant, motivating atmosphere of a fitness environment. Clean layouts ensure quick task completion while energetic accent colors reflect the dynamic nature of gym operations.

## Color Selection

A bold, high-energy palette that balances professional credibility with fitness motivation.

- **Primary Color**: Deep Purple `oklch(0.45 0.15 285)` - Represents premium quality and authority, used for key actions and navigation
- **Secondary Colors**: 
  - Vibrant Lime `oklch(0.85 0.20 130)` - Energy and vitality for success states and active memberships
  - Slate Gray `oklch(0.35 0.02 250)` - Professional neutrality for secondary actions
- **Accent Color**: Electric Cyan `oklch(0.75 0.15 200)` - High visibility for CTAs, notifications, and important metrics
- **Foreground/Background Pairings**:
  - Primary (Deep Purple): White text `oklch(1 0 0)` - Ratio 8.2:1 ✓
  - Accent (Electric Cyan): Dark slate `oklch(0.20 0.02 250)` - Ratio 11.5:1 ✓
  - Background (Off-white `oklch(0.98 0.005 90)`): Charcoal `oklch(0.25 0.01 270)` - Ratio 13.8:1 ✓
  - Success (Vibrant Lime): Dark green `oklch(0.30 0.10 130)` - Ratio 9.1:1 ✓

## Font Selection

Typography should communicate clarity, modernity, and athleticism - clean sans-serifs that remain legible in fast-paced environments.

- **Primary Font**: Space Grotesk - Technical precision with athletic character for headings and navigation
- **Secondary Font**: Inter - Exceptional legibility for data tables and body text

**Typographic Hierarchy**:
- H1 (Page Titles): Space Grotesk Bold / 32px / tight letter spacing (-0.02em)
- H2 (Section Headers): Space Grotesk SemiBold / 24px / normal spacing
- H3 (Card Headers): Space Grotesk Medium / 18px / normal spacing
- Body (Content): Inter Regular / 15px / line-height 1.6
- Small (Meta): Inter Regular / 13px / line-height 1.5 / text-muted-foreground
- Button Text: Inter SemiBold / 14px / uppercase / tracking-wide

## Animations

Animations emphasize **speed and responsiveness** - quick, snappy transitions that reinforce successful actions without slowing workflows. Micro-interactions provide satisfying feedback for status changes (member check-ins, status toggles) while page transitions maintain spatial orientation. QR code verification uses a brief pulse animation on success/denial to provide immediate visual feedback.

## Component Selection

- **Components**:
  - Dialog: Modal forms for creating/editing members and assigning memberships
  - Card: Dashboard metrics, member list items, and plan displays
  - Table: Member lists with sortable columns
  - Input: Form fields with clear validation states
  - Button: Varied variants (default, outline, destructive) for action hierarchy
  - Badge: Member status indicators (Active/Expired)
  - Tabs: Organize member detail sections (Info, History, QR)
  - Separator: Visual breathing room in dense information areas
  - Avatar: Member photos with fallback initials
  - Toast (Sonner): Success/error feedback for all actions

- **Customizations**:
  - Custom QR code component wrapping qrcode.react with branded styling
  - Enhanced sidebar with active state indicators
  - Status badge component with icon + color coding
  - Metric cards with trend indicators

- **States**:
  - Buttons: Clear hover lift effect, active press state, disabled opacity
  - Inputs: Focused cyan ring, error red border, success green border
  - Table rows: Subtle hover background, clickable cursor for details
  - Badges: Solid backgrounds with high contrast text

- **Icon Selection**:
  - Users (User list), UserPlus (Add member), QrCode (Access/Pass)
  - CreditCard (Memberships), Calendar (Dates), CheckCircle (Success)
  - XCircle (Denied), Clock (History), SignOut (Logout)

- **Spacing**:
  - Page padding: p-6 lg:p-8
  - Card padding: p-6
  - Section gaps: gap-6
  - Form fields: gap-4
  - Inline elements: gap-2

- **Mobile**:
  - Sidebar collapses to hamburger menu below 1024px
  - Tables switch to stacked card view on mobile
  - Two-column forms become single column below 640px
  - QR pass optimized for portrait mobile viewing with large touch targets
