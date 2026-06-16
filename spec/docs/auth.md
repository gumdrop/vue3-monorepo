# Authentication Flow

This document describes the authentication system used in the QuizLeague website.

## Overview

The system uses **Firebase Authentication** with two primary methods:
1.  **Email Link (Passwordless) Sign-in**: Users enter their email, receive a link, and are signed in upon clicking it.
2.  **Google Sign-in**: Users sign in using their Google account.

Both methods require the user to be a registered member of a team to successfully log in to the site.

## Data Model

### User
The canonical `User` entity stored in Firestore. It contains the user's email and display name.

### SiteUser
A `SiteUser` entity connects a Firestore `User` to a Firebase Authentication `uid`.
- `uid`: The unique identifier from Firebase Auth.
- `user`: A reference to the canonical `User` entity.
- `handle`: The user's display name on the site.
- `avatar`: URL to the user's profile picture.

### TeamMember
A singleton document at `team/{teamId}/member/members` that lists the `User` references belonging to a team.

## Login Flow (Email Link)

1.  **Verification**: The user enters their email on the `/login` page.
2.  **Server Check**: The client calls `GET /rest/site/site-user-for-email/:email`.
    - The server checks if a `User` exists with that email.
    - If found, it checks if the `User` belongs to any `Team`.
    - If both conditions are met, it returns the `SiteUser` (creating one if it doesn't exist).
    - If either condition fails, it returns a 404 error.
3.  **Email Sending**: If the server check passes, the client calls Firebase `sendSignInLinkToEmail`.
    - The `url` is set to `${window.location.origin}/login`.
    - The email is stored in `localStorage` as `emailForSignIn`.
4.  **Completion**: When the user clicks the link in their email:
    - They are redirected back to `/login`.
    - The `LoginMain.vue` component calls `checkEmailSignInLink` on mount.
    - `checkEmailSignInLink` (in `AuthService.ts`) detects the Firebase link in the URL.
    - It retrieves the email from `localStorage` (or prompts the user if missing).
    - It calls Firebase `signInWithEmailLink`.
    - Upon success, it updates the `SiteUser` with the new Firebase `uid` and redirects the user to `/home`.

## Authentication Guards

- `authGuard`: Ensures the user is logged in. Used for routes like `/results/submit`.
- `unauthGuard`: Ensures the user is NOT logged in.

## Technical Notes

- **VueFire**: The application uses `vuefire` and `VueFireAuth` for reactive authentication state.
- **Pinia Store**: The `useUserStore` in `client/src/stores/app.ts` manages the current `LoggedInUser` state, which includes the `SiteUser`, `User`, and `Team` information.
- **Firebase Emulator**: During local development, the system connects to the Firebase Auth and Firestore emulators.
