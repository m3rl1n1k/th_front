# FinanceFlow API Documentation (for PHP Backend)

This document outlines the API endpoints and data structures required for the FinanceFlow application. The backend should be implemented in PHP.

## Base URL

All API endpoints are relative to a base URL. For example: `https://yourdomain.com/api`

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

#### `POST /auth/login`
Logs in a user. The backend should associate the provided email with a username (this could be the email itself, a generated username, or a user-chosen one if you implement registration).

*   **Request Body**:
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "user": {
        "id": 1,
        "login": "user_login_name",
        "email": "user@example.com",
        "userCurrency": {
           "code": "USD"
        },
        "memberSince": "2023-01-15T10:00:00Z"
        // roles are internal and not sent to client
      },
      "token": "your_jwt_token_here"
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format.

#### `POST /auth/logout` (Optional)
Invalidates the user's session/token if server-side session management or token blocklisting is implemented.

*   **Request Body**: None (token in header)
*   **Success Response (204 No Content)**

### 2. User Profile

#### `GET /users/me`
Retrieves the profile information for the currently authenticated user.

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 1,
      "login": "user_login_name",
      "email": "user@example.com",
      "memberSince": "2023-01-15T10:00:00Z", // ISO 8601 date string
      "userCurrency": {
        "code": "USD" // User's preferred currency code
      }
      // roles are internal and not sent to client
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `PUT /users/me` (Or `/profile`)
Updates the profile information for the currently authenticated user.

*   **Request Body**:
    ```json
    {
      "login": "new_user_login_name",
      "email": "new_email@example.com",
      "userCurrencyCode": "EUR" // Send only the currency code string
      // ... other updatable fields
    }
    ```
*   **Success Response (200 OK)**: Returns the updated user profile (same format as `GET /users/me`).
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

### 3. Dashboard

#### `GET /dashboard/summary`
Retrieves summary financial data for the dashboard.

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "total_balance": 64234,   // Integer, in cents (e.g., $642.34)
      "month_income": 457357,  // Integer, in cents (e.g., $4573.57 for the current month)
      "month_expense": 363637  // Integer, in cents (e.g., $3636.37 for the current month)
    }
    ```
*   **Failure Response (401 Unauthorized)**

### 4. Transactions

#### `GET /transactions/types`
Retrieves available transaction types.

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "types": {
        "1": "INCOME",
        "2": "EXPENSE",
        "3": "TRANSFER"
      }
    }
    ```
    *Note: The frontend will filter this to show only INCOME and EXPENSE for the creation form.*
*   **Failure Response (401 Unauthorized)**

#### `POST /transactions`
Creates a new transaction.

*   **Request Body**:
    ```json
    {
      "amount": 5000,          // Integer, in cents (e.g., $50.00)
      "description": "Groceries for the week",
      "typeId": "2",           // ID of the transaction type (e.g., "2" for EXPENSE)
      "date": "2024-07-28",    // Date in YYYY-MM-DD format
      "isRecurring": false     // Boolean
      // ... any other relevant fields like wallet_id, category_id, currency_code for the transaction if different from user's default
    }
    ```
*   **Success Response (201 Created)**: Returns the created transaction object.
    ```json
    {
      "id": 123,
      "amount": { "amount": 5000, "currency": { "code": "USD" } }, // Updated structure
      "currency": { "code": "USD" },
      "exchangeRate": 1,
      "type": 2, // Numeric type
      "description": "Groceries for the week",
      "wallet": { "id": 1, "name": "Main" },
      "subCategory": null,
      "user": { "id": 1 },
      "source": "manual",
      "date": "2024-07-28T14:30:00Z", // ISO 8601
      "isRecurring": false
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `GET /transactions`
Retrieves a list of transactions for the authenticated user. The response should be `{"transactions": [...]}`.

*   **Query Parameters (Examples)**:
    *   `page=1`
    *   `limit=20`
    *   `typeId=1` (numeric)
    *   `startDate=2024-01-01`
    *   `endDate=2024-01-31`
*   **Success Response (200 OK)**:
    ```json
    {
      "transactions": [ // Key is "transactions"
        {
          "id": 123,
          "amount": { "amount": 5000, "currency": { "code": "USD" } },
          "currency": { "code": "USD" },
          "exchangeRate": 1,
          "type": 2, // Numeric type
          "description": "Groceries",
          "wallet": { "id": 1, "name": "Main" },
          "subCategory": null,
          "user": { "id": 1 },
          "source": "store_x",
          "date": "2024-07-28T14:30:00Z",
          "isRecurring": false
        }
        // ... more transactions
      ]
      // Meta/pagination info can be added here if needed, e.g., outside the "transactions" array
      // "meta": { "currentPage": 1, "totalPages": 5, ... }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /transactions/{id}`
Retrieves a specific transaction by its ID.

*   **Success Response (200 OK)**: Single transaction object (same format as in the list).
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `PUT /transactions/{id}`
Updates a specific transaction.

*   **Request Body**: Similar to `POST /transactions`, containing fields to update.
*   **Success Response (200 OK)**: Updated transaction object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /transactions/{id}`
Deletes a specific transaction.

*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**

## Data Models (PHP Representations - Examples)

Consider these when designing your database and PHP classes/objects.

### User
*   `id` (int, primary key)
*   `login` (string, unique, used for display)
*   `email` (string, unique)
*   `password_hash` (string, if implementing direct password auth instead of email-only link)
*   `user_currency_code` (string, e.g., "USD", "EUR")
*   `created_at` (datetime)
*   `updated_at` (datetime)
*   `roles` (array/json, e.g., `["ROLE_USER"]`, for internal use)

### Transaction
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `amount_cents` (int)
*   `currency_code` (string, e.g., "USD", related to this specific transaction)
*   `exchange_rate` (decimal/float, if supporting multi-currency conversions)
*   `description` (string, nullable)
*   `type` (int, e.g., 1 for INCOME, 2 for EXPENSE)
*   `wallet_id` (int, foreign key to Wallet)
*   `subcategory_id` (int, nullable, foreign key to SubCategory)
*   `source` (string, nullable)
*   `transaction_date` (datetime)
*   `is_recurring` (boolean)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### TransactionType (Conceptual, might be an ENUM or simple mapping in code)
*   `id` (int, e.g., 1, 2)
*   `name` (string, e.g., "INCOME", "EXPENSE")

### Wallet
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `name` (string)
*   `created_at` (datetime)
*   `updated_at` (datetime)


## Further Considerations

*   **Database**: Choose a suitable database (e.g., MySQL, PostgreSQL).
*   **PHP Framework**: Using a PHP framework (e.g., Laravel, Symfony) is highly recommended to handle routing, ORM, security, etc.
*   **Security**:
    *   Sanitize all user inputs.
    *   Protect against SQL injection, XSS, CSRF.
    *   Use HTTPS for all communications.
*   **Validation**: Implement robust server-side validation for all incoming data.
*   **CORS**: Configure Cross-Origin Resource Sharing (CORS) headers appropriately to allow requests from your Next.js frontend domain.
    ```php
    // Example PHP CORS headers (actual implementation depends on framework)
    header("Access-Control-Allow-Origin: <YOUR_FRONTEND_URL>"); // e.g., http://localhost:3000
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    // Handle OPTIONS preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    ```

This documentation provides a starting point. Adapt and expand it based on the full feature set of FinanceFlow.
