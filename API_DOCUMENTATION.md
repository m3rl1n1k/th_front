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
        "id": 1, // User's unique ID
        "login": "user_login_name", // Username to display
        "email": "user@example.com"
        // ... other user details if needed
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
      "memberSince": "2023-01-15T10:00:00Z" // ISO 8601 date string
      // ... other profile details
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `PUT /users/me` (Or `/profile`)
Updates the profile information for the currently authenticated user.

*   **Request Body**:
    ```json
    {
      "login": "new_user_login_name", // Example field
      "email": "new_email@example.com" // Example field
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
        // Add more types as needed. The key is the ID, value is the display name.
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
      // ... any other relevant fields like wallet_id, category_id, etc.
    }
    ```
*   **Success Response (201 Created)**: Returns the created transaction object.
    ```json
    {
      "id": 123, // ID of the newly created transaction
      "amount": 5000,
      "description": "Groceries for the week",
      "typeId": "2",
      "typeName": "EXPENSE", // Optionally include type name
      "date": "2024-07-28",
      "isRecurring": false,
      "createdAt": "2024-07-28T14:30:00Z" // ISO 8601
      // ...
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `GET /transactions`
Retrieves a list of transactions for the authenticated user. Implement pagination and filtering as needed.

*   **Query Parameters (Examples)**:
    *   `page=1`
    *   `limit=20`
    *   `typeId=1`
    *   `startDate=2024-01-01`
    *   `endDate=2024-01-31`
*   **Success Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": 123,
          "amount": 5000,
          "description": "Groceries",
          "typeId": "2",
          "typeName": "EXPENSE",
          "date": "2024-07-28",
          "isRecurring": false,
          "createdAt": "2024-07-28T14:30:00Z"
        },
        // ... more transactions
      ],
      "meta": { // Pagination info
        "currentPage": 1,
        "totalPages": 5,
        "perPage": 20,
        "totalItems": 95
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /transactions/{id}`
Retrieves a specific transaction by its ID.

*   **Success Response (200 OK)**: Transaction object (same format as in the list).
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
*   `created_at` (datetime)
*   `updated_at` (datetime)

### Transaction
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `amount` (int, cents)
*   `description` (string)
*   `type_id` (int, foreign key to TransactionType or string if IDs are like "1", "2")
*   `transaction_date` (date)
*   `is_recurring` (boolean)
*   `wallet_id` (int, optional, foreign key to Wallet if implementing wallets)
*   `category_id` (int, optional, foreign key to Category if implementing categories)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### TransactionType
*   `id` (int or string, primary key, e.g., "1", "2")
*   `name` (string, e.g., "INCOME", "EXPENSE")

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
```