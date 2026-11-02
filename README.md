# My Photos — Hidden Pics
> *“Your private space for precious memories.”*

An elegant, secure, multi-user private photo vault built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Designed with end-to-end user isolation, private encrypted storage buckets, Instagram-style in-account device alerts, selective session revocation, and WebAuthn passkey support.

---

## Key Features

1. **Brown-and-Cream Luxury Aesthetics**
   - Rich dark chocolate brown headers, navigation bars, and primary buttons.
   - Warm cream backgrounds with subtle golden-caramel accents.
   - Refined typography (`Playfair Display` serif paired with `Plus Jakarta Sans`).
   - Smooth animations, rounded card contours, and responsive mobile-first layouts.

2. **Multi-User Private Photo Vault**
   - Independent user accounts with strict database Row-Level Security (RLS).
   - Drag-and-drop multiple photo uploads with live progress indicators.
   - Private album grouping, renaming, and organization.
   - Full-resolution preview lightbox with zoom, reset, keyboard navigation, and secure metadata inspection.
   - 100% private Supabase Storage buckets with short-lived (1-hour) signed URLs. Zero public photo URLs.

3. **Instagram-Style In-Account Security Alerts**
   - Real-time in-account alerts triggered whenever a new phone or computer signs in.
   - Prominent notification badge on the navigation bell icon.
   - Alerts specify device name, browser, operating system, and timestamp.
   - Users can review, mark as read, or dismiss security notices directly inside the application.

4. **Security & Devices (Selective Remote Session Revocation)**
   - View your current active device (`Active Now`).
   - Audit all other connected phones and computers.
   - Selectively **Revoke Access** for any unrecognized device with a single click.
   - **Sign Out All Other Devices** option.
   - Real-time heartbeat listener immediately logs out any revoked device session on the backend.
   - Brute-force rate limiting and failed-attempt tracking.

5. **Flexible Authentication**
   - Hashed Secret-Code login (never stored in plain text or exposed in frontend code).
   - Passwordless WebAuthn biometric passkeys (Face ID, Touch ID, Windows Hello).
   - Expiring single-use recovery links for forgotten secret codes.
   - Support for alternate stealth URL paths (e.g., `/a7k9m2x8`) for discreet access.

---

## Project Structure

```
Hidden pics/
├── public/
│   ├── favicon.svg             # Vault & camera brand icon
│   └── _redirects              # Netlify client-side routing rewrites
├── src/
│   ├── components/
│   │   ├── AlbumModal.tsx      # Create and rename photo albums
│   │   ├── ConfigBanner.tsx    # Supabase setup notice & guidance banner
│   │   ├── Footer.tsx          # Privacy guarantees & brand footer
│   │   ├── Navbar.tsx          # Chocolate header, Instagram bell & drawer
│   │   ├── PhotoLightbox.tsx   # Fullscreen photo viewer, zoom, download
│   │   └── PhotoUploadModal.tsx# Drag-and-drop uploader with progress
│   ├── context/
│   │   ├── AlertsContext.tsx   # Real-time in-account security alerts
│   │   └── AuthContext.tsx     # Supabase auth, heartbeat, revocation monitor
│   ├── lib/
│   │   ├── deviceDetection.ts  # Device, browser, and OS parsing
│   │   ├── supabase.ts         # Supabase client & DB operations
│   │   └── webauthn.ts         # Native WebAuthn passkey registration/login
│   ├── pages/
│   │   ├── AlbumsPage.tsx      # Albums gallery & management
│   │   ├── AuthPage.tsx        # Secret code & Passkey login/register
│   │   ├── LandingPage.tsx     # Public welcome page with design preview
│   │   ├── RecoveryPage.tsx    # Expiring link secret code reset
│   │   ├── SecurityDevicesPage.tsx # Sessions, revocation & security events
│   │   ├── SettingsPage.tsx    # Profile, login methods, account deletion
│   │   └── VaultPage.tsx       # Main encrypted photo vault & filters
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── App.tsx                 # Routes, guards, and layout
│   ├── index.css               # Tailwind CSS v4 custom theme tokens
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Complete SQL schema, RLS & storage rules
├── .env.example                # Safe environment variable template
├── netlify.toml                # Netlify deployment & security headers
├── package.json
└── vite.config.ts
```

---

## Step-by-Step Windows Beginner Setup Guide

### 1. Run the Website Locally

1. Open PowerShell or Command Prompt in this folder:
   ```powershell
   cd "c:\Users\Shweta N\OneDrive\Desktop\Hidden pics"
   ```
2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Start the local development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *Note: You can also test the discreet URL path:*
   ```
   http://localhost:5173/a7k9m2x8
   ```

---

### 2. Create and Configure Your Free Supabase Project

1. Visit [Supabase](https://supabase.com) and click **Start your project** (or sign in).
2. Click **New Project**:
   - Choose any name (e.g. `My Photos Vault`).
   - Set a strong database password.
   - Choose your preferred geographic region.
3. Once the project finishes provisioning (takes ~1 minute), go to **Project Settings** (gear icon) &rarr; **API**:
   - Copy your **Project URL** (e.g. `https://xyzabc.supabase.co`).
   - Copy your **anon / public** API Key.
   - *Never copy or use your service_role secret key in the frontend.*

---

### 3. Apply Database Migrations & Security Policies

1. In your Supabase Dashboard, click on the **SQL Editor** tab on the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/001_initial_schema.sql` in this project.
4. Copy the entire contents and paste it into the Supabase SQL Editor.
5. Click **Run** (or press `Ctrl + Enter`).

This script automatically creates:
- `profiles` table with automatic user creation triggers.
- `albums` table with Row Level Security (RLS).
- `photos` table with Row Level Security (RLS).
- `user_sessions` table with device metadata and revocation tracking.
- `security_events` table for in-account Instagram-style alerts.
- `failed_login_logs` table for brute-force tracking.
- Stored procedures: `sign_out_all_other_sessions` and `revoke_user_session`.
- Indexes for fast querying.

---

### 4. Configure Private Photo Storage

The SQL script automatically creates the private `photos` storage bucket with Row-Level Security policies.

To verify in the Supabase Dashboard:
1. Click **Storage** on the left menu.
2. You will see a bucket named **`photos`**.
3. Ensure the padlock icon shows **Private** (Public: `false`).
4. Click on **Policies** under Storage to verify that users can only upload, view, and delete objects inside their personal user ID folder: `auth.uid()::text = (storage.foldername(name))[1]`.

---

### 5. Configure Your Local Environment Variables

1. In the project root, make a copy of `.env.example` named `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `.env` in your text editor and fill in your actual credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your_anon_key_here
   VITE_SPECIAL_PATH=/a7k9m2x8
   ```
3. Restart your development server (`npm run dev`) so Vite picks up the new environment variables. The setup banner will disappear automatically!

---

### 6. Configure Authentication & Account Recovery

1. In your Supabase Dashboard, click **Authentication** &rarr; **URL Configuration**:
   - Set **Site URL** to your local address (`http://localhost:5173`) or your production Netlify address (`https://your-site.netlify.app`).
   - Under **Redirect URLs**, add:
     - `http://localhost:5173/recovery`
     - `https://your-site.netlify.app/recovery`
2. Under **Authentication** &rarr; **Providers** &rarr; **Email**:
   - Ensure Email provider is enabled.
   - For local development and testing, you can disable "Confirm email" if you want to sign in immediately without waiting for confirmation emails, or leave it enabled for production.

---

### 7. Deploy to Netlify

1. Build the production output to test locally:
   ```powershell
   npm run build
   ```
2. Deploy via the **Netlify CLI** or through GitHub:
   - **Method A: Push to GitHub**:
     1. Push this folder to a private GitHub repository.
     2. In Netlify, click **Add new site** &rarr; **Import an existing project** &rarr; **GitHub**.
     3. Select your repository.
     4. Build command: `npm run build`
     5. Publish directory: `dist`
   - **Method B: Netlify CLI**:
     ```powershell
     npm install -g netlify-cli
     netlify deploy --prod --dir=dist
     ```
3. In Netlify **Site configuration** &rarr; **Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SPECIAL_PATH` (e.g. `/a7k9m2x8`)
4. The included `netlify.toml` and `public/_redirects` automatically configure SPA routing rewrites and security headers (`X-Frame-Options`, `Content-Type-Options`, `Permissions-Policy`).

---

### 8. Testing Checklist

Before going live, perform this secure verification:

- [ ] **Multi-User Isolation**:
  - Register Account A (`user1@example.com`). Upload 2 photos and create an album.
  - Open an Incognito window and register Account B (`user2@example.com`).
  - Verify Account B sees **zero photos** and cannot view Account A's album or photos.
  - Attempt to construct a signed URL for Account A's photo while logged into Account B — verify that Supabase Storage rejects access with HTTP 400/403.
- [ ] **Instagram-Style In-Account Alert**:
  - Sign in from a second browser or phone with Account A.
  - Refresh Account A on your original browser.
  - Notice the **bell icon badge** lights up with a "New login detected" notification detailing the device and browser.
- [ ] **Selective Session Revocation**:
  - On your primary computer, go to **Security & Devices**.
  - Locate the second device in "Other Active Sessions".
  - Click **Revoke Access**.
  - Switch to the second device: within 15 seconds (or on the next navigation), the device is automatically signed out with an access revoked alert.
- [ ] **Account Recovery**:
  - Click "Forgot secret code?" on the login page.
  - Verify recovery link email delivery, follow the link to `/recovery`, and set a new secret code.
- [ ] **Both URL Paths**:
  - Visit `/` and verify the landing page.
  - Visit `/a7k9m2x8` and verify it loads the same secure gateway without exposing photos or bypassing authentication.

---

## Privacy & Security Summary

| Feature | How It Is Protected |
| :--- | :--- |
| **Photographs** | Stored in private Supabase bucket `photos`. Served exclusively via short-lived signed URLs. |
| **Row Level Security** | Enforced at the Postgres database kernel level. Users can query only rows matching `auth.uid() = user_id`. |
| **Secret Codes** | Bcrypt hashed on Supabase Auth backend. Never transmitted or stored in plain text. |
| **Passkeys** | Standard WebAuthn API. Biometric verification occurs purely on-device hardware. |
| **Session Control** | Registered in `user_sessions` with real-time invalidation. Revoked tokens lose photo access immediately. |
| **Brute-Force Shield** | Failed attempt logging with automatic 15-minute lockout after 5 consecutive failures. |
