# Example Journey — TEMPLATE

This is a template journey file. Replace its contents with a real
journey (or delete it after you have one of your own). Use it as the
shape — every real journey must look like this.

# Sign In

- Entry page: LoginPage
- Other pages: DashboardPage
- Business goal: Authenticate a known user and land them on the dashboard.
- Priority: P0
- Test data: `UserData.pickFor('login')` — returns the `activeUser`
  template by default, or `adminUser` if the test name contains
  "admin".

## Steps

1. Open the login page.
   - expect: The login form is visible (page-ready identifier).
2. Enter the username.
   - expect: The username field accepts the value.
3. Enter the password.
   - expect: The password field accepts the value (masked).
4. Click the sign-in button.
   - expect: The page navigates to the dashboard.
5. Land on the dashboard.
   - expect: The user table is visible.

## Negative paths

- Wrong password
  - expect: An error banner appears; URL stays on `/login`.
- Disabled account
  - expect: The user sees an "account disabled" message; URL stays on
    `/login`.
- Empty username
  - expect: The form does not submit; a validation message appears
    under the username field.

## Glossary dependencies

- `username` — used in step 2
- `password` — used in step 3
- `submit sign-in` — used in step 4
- `user table` — used in step 5
- `error banner` — used in negative paths

## Glossary gaps

(none — every term is already in `glossary.md`)
