# FinanceFlow API Documentation (for PHP Backend)

This document outlines the API endpoints and data structures required for the FinanceFlow application. The backend should be implemented in PHP.

## Base URL

All API endpoints are relative to a base URL. For example: `https://yourdomain.com/api`

For local development, when accessing the Next.js frontend from a mobile device on the same network, ensure the `NEXT_PUBLIC_API_BASE_URL` in your Next.js `.env.local` file points to your computer's local IP address (e.g., `http://192.168.1.100:8000/api`).

## Authentication

Authentication is handled via JWT (JSON Web Tokens).

*   **Token Transmission**: The JWT token should be sent in the `Authorization` header with the `Bearer` scheme:
    `Authorization: Bearer <YOUR_JWT_TOKEN>`
*   **Token Generation**: The login endpoint will generate a token.
*   **Token Expiry & Refresh**: Implement appropriate token expiry and consider a refresh token mechanism if long-lived sessions are required.

## General Conventions

*   **Content Type**: Use `application/json` for request and response bodies.
*   **HTTP Status Codes**: Use standard HTTP status codes to indicate success or failure.
    *   `200 OK`: Successful GET, PUT, PATCH.
    *   `201 Created`: Successful POST.
    *   `204 No Content`: Successful DELETE or operations that don't return a body.
    *   `400 Bad Request`: Invalid request payload (e.g., validation errors).
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Authenticated user does not have permission.
    *   `404 Not Found`: Resource not found.
    *   `500 Internal Server Error`: Server-side error.
*   **Error Responses**: For `4xx` and `5xx` errors, return a JSON object with at least a `message` field. For validation errors (`400`), an `errors` object detailing field-specific errors is helpful:
    ```json
    {
      "message": "Validation Failed",
      "errors": {
        "email": ["The email field is required."],
        "amount": ["The amount must be a positive number."]
      }
    }
    ```
*   **Monetary Values**: All monetary values (amounts, balances) should be handled as **integers representing cents** to avoid floating-point inaccuracies. For example, $10.50 should be stored and transmitted as `1050`.

## Endpoints

### 1. Authentication

#### `POST /login_check`
Logs in a user.
*   **Request Body**:
    ```json
    {
      "username": "user@example.com", // User's email address
      "password": "user_password"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "user": {
        "id": 1,
        "login": "user_login_name",
        "email": "user@example.com",
        "isVerified": true,
        "memberSince": "2023-01-15T10:00:00Z",
        "userCurrency": {
           "code": "USD"
        },
        "roles": ["ROLE_USER"],
        "settings": {
            "chart_income_color": "#10b981",
            "chart_expense_color": "#ef4444",
            "chart_capital_color": "#f59e0b",
            "records_per_page": 10
        },
        "subscription": {
            "plan_name": "Pro Plan",
            "status": "active",
            "ends_at": null,
            "trial_ends_at": "2024-12-31T23:59:59Z"
        }
      },
      "token": "your_jwt_token_here"
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format.

#### `POST /auth/register`
Registers a new user. The backend should automatically generate a verification token and send a verification email upon successful registration.
**Note:** The link in the verification email should point to the frontend application at the path `/email-verification`, with the token as a query parameter. Example: `https://your-frontend-domain.com/email-verification?token=<verification_token>`
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "login": "user_chosen_login_name",
      "password": "securepassword123"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "User registered successfully. Please check your email to verify your account."
    }
    ```
*   **Failure Response (400 Bad Request)**: Standard error format, especially if email/login already exists or password is too weak.

#### `POST /auth/logout` (Optional)
Invalidates the user's session/token if server-side session management or token blocklisting is implemented.
*   **Request Body**: None (token in header)
*   **Success Response (204 No Content)**

### 1.bis. Email Verification

#### `POST /verify-email`
Verifies a user's email address using a token sent to their email.
*   **Request Body**:
    ```json
    {
      "token": "verification_token_from_email_link"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Email verified successfully. You can now login."
    }
    ```
*   **Failure Response (400 Bad Request)**: Invalid or expired token.
    ```json
    {
      "message": "Invalid or expired verification token."
    }
    ```

#### `GET /re-send/verify-email`
Resends the verification email to the currently authenticated user if their email is not yet verified.
*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "A new verification email has been sent."
    }
    ```
*   **Failure Response (401 Unauthorized, 403 Forbidden if already verified)**

### 2. User Profile

#### `GET /user`
Retrieves the profile information for the currently authenticated user.
*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 1,
      "login": "user_login_name",
      "email": "user@example.com",
      "isVerified": true,
      "memberSince": "2023-01-15T10:00:00Z",
      "userCurrency": {
        "code": "USD"
      },
      "roles": ["ROLE_USER"],
      "settings": {
        "chart_income_color": "#10b981",
        "chart_expense_color": "#ef4444",
        "chart_capital_color": "#f59e0b",
        "records_per_page": 10
      },
      "subscription": {
        "plan_name": "Pro Plan",
        "status": "active",
        "ends_at": null,
        "trial_ends_at": "2024-12-31T23:59:59Z"
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `PUT /user`
Updates the profile information for the currently authenticated user.
*   **Request Body**:
    ```json
    {
      "login": "new_user_login_name",
      "email": "new_email@example.com",
      "userCurrencyCode": "EUR"
    }
    ```
*   **Success Response (200 OK)**: Returns the updated user profile (including settings and subscription).
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `POST /user/change-password`
Allows the authenticated user to change their password.
*   **Request Body**:
    ```json
    {
      "currentPassword": "current_secure_password",
      "newPassword": "new_very_secure_password"
    }
    ```
*   **Success Response (200 OK or 204 No Content)**
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

### 3. Dashboard
... (rest of the file remains unchanged)
<-- Omitted for brevity -->
### 10. Capital & Invitations

#### `GET /capital/{id}`
Retrieves detailed information about a specific capital group.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "capital": {
        "id": 1,
        "name": "Family Finances",
        "owner": {
          "id": 1,
          "email": "owner@example.com",
          "login": "owner_login"
        },
        "users": [
          {
            "id": 1,
            "email": "owner@example.com",
            "login": "owner_login"
          },
          {
            "id": 2,
            "email": "member@example.com",
            "login": "member_login"
          }
        ]
      },
      "details": {
        "total_capital_sum": 500000, // in cents
        "user_capital_sum": 200000,   // in cents
        "expenses_by_categories": {   // NEW
          "owner_login": {
            "Groceries": { "amount": 15000, "color": "#10b981" },
            "Utilities": { "amount": 5000, "color": "#f59e0b" }
          },
          "member_login": {
            "Transport": { "amount": 8000, "color": "#3b82f6" }
          }
        }
      }
    }
    ```
*   **Failure Response**: `401`, `403`, `404`.
### 11. Subscriptions (Stripe)

#### `POST /subscription/checkout-session`
Creates a Stripe Checkout session for a user to purchase a subscription.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "price_id": "price_1..." // The ID of the Stripe Price object
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "sessionId": "cs_test_a1..." // The ID of the Stripe Checkout Session
    }
    ```
*   **Failure Response**: `400`, `401`.

#### `POST /subscription/portal-session`
Creates a Stripe Customer Portal session for a user to manage their existing subscription.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "url": "https://billing.stripe.com/p/session/..." // The URL to the Stripe Customer Portal
    }
    ```
*   **Failure Response**: `400`, `401`.

#### Stripe Webhooks `POST /webhooks/stripe`
The backend must implement a webhook endpoint to receive events from Stripe. The endpoint must handle events like `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed` to keep the user's subscription status in sync. This endpoint does not require JWT authentication but should be protected using Stripe's webhook signature verification.

### Feedbacks
... (rest of the file remains unchanged)
<-- Omitted for brevity -->
/home/user/studio/src/img
