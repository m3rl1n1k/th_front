
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
        "login": "user_login_name", // The actual username/login
        "email": "user@example.com",
        "isVerified": true, // **NEW**: Indicates if the user's email is verified
        "userCurrency": {
           "code": "USD"
        },
        "memberSince": "2023-01-15T10:00:00Z",
        "roles": ["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"],
        "settings": { // User settings included here
            "chart_income_color": "#10b981",
            "chart_expense_color": "#ef4444",
            "chart_capital_color": "#f59e0b",
            "records_per_page": 10
        }
      },
      "token": "your_jwt_token_here"
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format.

#### `POST /auth/register`
Registers a new user. The backend should automatically generate a verification token and send a verification email upon successful registration.
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "login": "user_chosen_login_name", // Desired username
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

#### `POST /auth/verify/resend`
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
      "isVerified": true, // **NEW**: Indicates if the user's email is verified
      "memberSince": "2023-01-15T10:00:00Z",
      "userCurrency": {
        "code": "USD"
      },
      "roles": ["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"],
      "settings": {
        "chart_income_color": "#10b981",
        "chart_expense_color": "#ef4444",
        "chart_capital_color": "#f59e0b",
        "records_per_page": 10
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `PUT /user`
Updates the profile information for the currently authenticated user.
*   **Request Body**:
    ```json
    {
      "login": "new_user_login_name", // Username
      "email": "new_email@example.com",
      "userCurrencyCode": "EUR" // User's preferred currency code
    }
    ```
*   **Success Response (200 OK)**: Returns the updated user profile (including settings).
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
