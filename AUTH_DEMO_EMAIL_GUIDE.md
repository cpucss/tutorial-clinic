# Demo Authentication And Email Change Guide

This app does not use a backend, database, or CSV for authentication yet. The login system is a front-end mock that uses hard-coded users.

## How The Current Demo Login Works

The demo users are stored in:

```text
src/mock/index.ts
```

Important: this is not a root-level `index.ts` file. Open the folders in this order:

```text
src
mock
index.ts
```

In VS Code, you can also press `Ctrl + P` and type:

```text
src/mock/index.ts
```

The app imports it as `../../../mock` because TypeScript automatically looks for `index.ts` inside the `mock` folder.

The login page imports those users:

```ts
import { demoUsers } from "../../../mock";
```

When a user logs in, `LoginPage.tsx` checks the email or student ID against `demoUsers`:

```ts
const match =
  demoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ??
  demoUsers.find((user) => user.studentId.toLowerCase() === email.trim().toLowerCase());
```

If a matching user is found, the app stores that user in React state inside `App.tsx`.

No real password verification happens yet. The app only checks that the password field is not empty.

## Current Demo Accounts

Current student demo user:

```ts
export const currentUser = {
  id: "stu-042",
  name: "Aria Mendoza",
  studentId: "2024-00421",
  yearLevel: "Junior" as YearLevel,
  email: "aria.m@school.edu",
  points: 340,
  role: "student" as const,
};
```

Current admin demo user:

```ts
{
  id: "adm-001",
  name: "Nadia Cruz",
  studentId: "ADMIN-001",
  yearLevel: "Senior" as YearLevel,
  email: "admin@tutorialclinic.edu",
  points: 980,
  role: "admin" as const,
}
```

## How To Change The Student Demo Email

Open:

```text
src/mock/index.ts
```

Find:

```ts
email: "aria.m@school.edu",
```

Change it to your CCS demo email. Example:

```ts
email: "ccs.student.demo@tutorialclinic.edu",
```

You can use any format your team wants, for example:

```ts
email: "ccs.demo@student.edu",
email: "student.demo@ccs.edu",
email: "ccs.student.demo@school.edu",
```

## How To Change The Admin Demo Email

Open:

```text
src/mock/index.ts
```

Find:

```ts
email: "admin@tutorialclinic.edu",
```

Change it to your CCS admin demo email. Example:

```ts
email: "ccs.admin.demo@tutorialclinic.edu",
```

## How To Change The Default Email Shown On The Login Page

The login input currently opens with this default email:

```ts
const [email, setEmail] = useState("aria.m@school.edu");
```

This is located in:

```text
src/features/auth/pages/LoginPage.tsx
```

If you changed the student email in `src/mock/index.ts`, also change the default login email to match.

Example:

```ts
const [email, setEmail] = useState("ccs.student.demo@tutorialclinic.edu");
```

Also update the placeholder if you want the sample text to match:

```tsx
placeholder="ccs.student.demo@tutorialclinic.edu"
```

## Important: Demo Button Login Does Not Need Email

The `Demo student` and `Demo admin` buttons log in directly from the `demoUsers` array.

Student button:

```tsx
<button type="button" onClick={() => finishLogin(demoUsers[0])}>
  Demo student
</button>
```

Admin button:

```tsx
<button type="button" onClick={() => finishLogin(demoUsers[1])}>
  Demo admin
</button>
```

Because of this, changing the email mainly affects manual login through the email input.

## Recommended CCS Demo Emails

Use clear demo-only emails so developers know they are not real accounts:

```text
ccs.student.demo@tutorialclinic.edu
ccs.admin.demo@tutorialclinic.edu
```

If your school already has an official domain, replace `tutorialclinic.edu` with your real school domain.

## Files To Edit

To change demo account emails:

```text
src/mock/index.ts
```

To change the default login input and placeholder:

```text
src/features/auth/pages/LoginPage.tsx
```

To change user role typing:

```text
src/types/user.ts
```

Usually, you only need the first two files.

## Example Complete Change

In `src/mock/index.ts`:

```ts
export const currentUser = {
  id: "stu-042",
  name: "CCS Demo Student",
  studentId: "2024-00421",
  yearLevel: "Junior" as YearLevel,
  email: "ccs.student.demo@tutorialclinic.edu",
  points: 340,
  role: "student" as const,
};
```

In the admin demo user:

```ts
{
  id: "adm-001",
  name: "CCS Demo Admin",
  studentId: "ADMIN-001",
  yearLevel: "Senior" as YearLevel,
  email: "ccs.admin.demo@tutorialclinic.edu",
  points: 980,
  role: "admin" as const,
}
```

In `src/features/auth/pages/LoginPage.tsx`:

```ts
const [email, setEmail] = useState("ccs.student.demo@tutorialclinic.edu");
```

And:

```tsx
placeholder="ccs.student.demo@tutorialclinic.edu"
```

## Testing After Changing The Email

Run:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Test manual student login:

1. Enter the new student demo email.
2. Enter any non-empty password.
3. Click `Log in`.
4. The app should open the student dashboard.

Test manual admin login:

1. Enter the new admin demo email.
2. Enter any non-empty password.
3. Click `Log in`.
4. The app should open the admin dashboard.

## What To Add Later With Backend

When the backend and database are ready, replace this mock behavior with:

- Real users table
- Hashed passwords
- Login API endpoint
- Session cookie or JWT token
- Protected frontend routes
- Protected backend routes
- Real role checks from the database

Until then, this mock login is only for UI testing and developer demos.
