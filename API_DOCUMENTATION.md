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
        "userCurrency": {
           "code": "USD"
        },
        "memberSince": "2023-01-15T10:00:00Z"
      },
      "token": "your_jwt_token_here"
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format.

#### `POST /auth/register`
Registers a new user.
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
      "message": "User registered successfully. Please login."
      // Optionally, can return the created user object as in GET /users/me
    }
    ```
    Or simply a `201 Created` status with no body.
*   **Failure Response (400 Bad Request)**: Standard error format, especially if email/login already exists or password is too weak.
    ```json
    // Example validation error for registration
    {
      "message": "Validation Failed",
      "errors": {
        "email": ["This email address is already registered."],
        "login": ["This username is already taken."],
        "password": ["Password must be at least 6 characters long."]
      }
    }
    ```


#### `POST /auth/logout` (Optional)
Invalidates the user's session/token if server-side session management or token blocklisting is implemented.

*   **Request Body**: None (token in header)
*   **Success Response (204 No Content)**

### 2. User Profile

#### `GET /users/me` (or `/user`)
Retrieves the profile information for the currently authenticated user.

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "id": 1,
      "login": "user_login_name",
      "email": "user@example.com",
      "memberSince": "2023-01-15T10:00:00Z",
      "userCurrency": {
        "code": "USD"
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `PUT /users/me` (Or `/profile`)
Updates the profile information for the currently authenticated user.

*   **Request Body**:
    ```json
    {
      "login": "new_user_login_name", // Username
      "email": "new_email@example.com",
      "userCurrencyCode": "EUR" // User's preferred currency code
      // Password changes should ideally be a separate endpoint with current password confirmation
    }
    ```
*   **Success Response (200 OK)**: Returns the updated user profile (same format as `GET /users/me`).
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

### 3. Dashboard

#### `GET /dashboard/summary`
Retrieves summary financial data for the dashboard. *(Deprecated in favor of individual calls)*

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "total_balance": 64234,
      "month_income": 457357,
      "month_expense": 363637
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /dashboard/total-balance`
*   **Success Response (200 OK)**: `{"total_balance": 64234}`

#### `GET /dashboard/monthly-income`
*   **Success Response (200 OK)**: `{"month_income": 457357}`

#### `GET /dashboard/average-expenses` (Backend might send month_expense)
*   **Success Response (200 OK)**: `{"month_expense": 363637}`

#### `GET /dashboard/chart/total-expense`
Retrieves data for the monthly expenses by category chart.
*   **Success Response (200 OK)**:
    ```json
    {
      "month_expense_chart": {
        "Food & Dining": { "amount": 150000, "color": "#FFD700" },
        "Transportation": { "amount": 80000, "color": "#FF6384" },
        "no_category": { "amount": 50000, "color": "#CCCCCC" }
        // ... other categories, amounts in cents
      }
    }
    ```

#### `GET /dashboard/last-transactions/{limit}`
Retrieves a list of the last N transactions.
*   **Path Parameter**: `limit` (integer, e.g., 10)
*   **Success Response (200 OK)**:
    ```json
    {
      "last_transactions": [
        {
          "id": 123,
          "amount": { "amount": 5000, "currency": { "code": "USD" } }, // in cents
          "currency": { "code": "USD" },
          "exchangeRate": 1,
          "type": 2, // Numeric type ID
          "description": "Groceries",
          "wallet": { "id": 1, "name": "Main", "number": "ACCT123" },
          "subCategory": { "id": 101, "name": "Groceries"}, // null if not set
          "source": "manual", // or other source if applicable
          "date": "2024-07-28T14:30:00Z" // ISO date string
        }
        // ... more transactions up to limit
      ]
    }
    ```

### 4. Transactions

#### `GET /transactions/types`
Retrieves available transaction types for forms (e.g., Income, Expense).

*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "types": {
        "1": "INCOME",
        "2": "EXPENSE"
      }
    }
    ```
    *Note: Frontend might filter this further if more types are added backend-side for internal use.*
*   **Failure Response (401 Unauthorized)**

#### `GET /transactions/frequency`
Retrieves available transaction recurrence frequencies for forms.
*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "periods": {
        "1": "ONE_TIME",
        "2": "DAILY",
        "3": "WEEKLY",
        "4": "EVERY_TWO_WEEKS",
        "5": "MONTHLY",
        "6": "EVERY_6_MONTHS",
        "7": "YEARLY"
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `POST /transactions`
Creates a new transaction.

*   **Request Body**:
    ```json
    {
      "amount": 5000, // integer, in cents
      "description": "Groceries for the week", // string, optional
      "typeId": "2", // string, required (ID from GET /transactions/types)
      "date": "2024-07-28", // string, YYYY-MM-DD, required
      "wallet_id": 1, // integer ID, required
      "category_id": 101, // integer ID (refers to a subCategory ID), optional (null if not provided)
      "frequencyId": "1" // string, required (ID from GET /transactions/frequency)
    }
    ```
*   **Success Response (201 Created)**: Returns the created transaction object.
    ```json
    {
      "id": 123,
      "amount": { "amount": 5000, "currency": { "code": "USD" } },
      "currency": { "code": "USD" },
      "exchangeRate": 1,
      "type": 2, // Numeric type ID
      "description": "Groceries for the week",
      "wallet": { "id": 1, "name": "Main", "number": "ACCT123" },
      "subCategory": { "id": 101, "name": "Groceries"}, // subCategory object, null if not provided
      "user": { "id": 1 },
      "source": "manual", // or other source if applicable
      "date": "2024-07-28T14:30:00Z", // ISO date string
      "frequencyId": "1" // Or the actual frequency identifier stored by backend
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `GET /transactions`
Retrieves a list of transactions for the authenticated user. The response should be `{"transactions": [...]}`.

*   **Query Parameters (Examples)**:
    *   `page=1`
    *   `limit=20`
    *   `typeId=1` (numeric ID)
    *   `startDate=2024-01-01`
    *   `endDate=2024-01-31`
    *   `categoryId=101` (numeric, subCategory ID)
*   **Success Response (200 OK)**:
    ```json
    {
      "transactions": [
        {
          "id": 123,
          "amount": { "amount": 5000, "currency": { "code": "USD" } },
          "currency": { "code": "USD" },
          "exchangeRate": 1,
          "type": 2, // Numeric type ID
          "description": "Groceries",
          "wallet": { "id": 1, "name": "Main", "number": "ACCT123" },
          "subCategory": { "id": 101, "name": "Groceries"}, // null if not set
          "user": { "id": 1 },
          "source": "store_x",
          "date": "2024-07-28T14:30:00Z", // ISO date string
          "isRecurring": false, // This field might change if frequencyId is adopted
          "frequencyId": "1" 
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /transactions/{id}`
Retrieves a specific transaction by its ID. The response should be `{"transaction": {...}}`.
*   **Success Response (200 OK)**: Single transaction object (same format as items in `GET /transactions` list).
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `PUT /transactions/{id}`
Updates a specific transaction.
*   **Request Body**: Similar to `POST /transactions`, containing fields to update. `category_id` can be `null`. `frequencyId` should be provided.
    ```json
    {
      "amount": 5500, // integer, in cents
      "description": "Updated description", // string, optional
      "typeId": "1", // string, required (ID from GET /transactions/types)
      "date": "2024-07-29", // string, YYYY-MM-DD, required
      "wallet_id": 2, // integer ID, required
      "category_id": null, // integer ID or null
      "frequencyId": "5" // string, required
    }
    ```
*   **Success Response (200 OK)**: Updated transaction object (same format as `GET /transactions/{id}`).
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /transactions/{id}`
Deletes a specific transaction.

*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `GET /transactions/repeated/{id}/status/toggle`
Toggles the status (active/inactive) of a repeated transaction definition.
*   **Path Parameter**: `id` (integer ID of the repeated transaction definition)
*   **Success Response (200 OK)**: Returns the updated `RepeatedTransactionEntry` object.
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `DELETE /transactions/repeated/{id}`
Deletes a repeated transaction definition. This does not delete already created transactions.
*   **Path Parameter**: `id` (integer ID of the repeated transaction definition)
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**


### 5. Wallets

#### `GET /wallets`
Retrieves a list of wallets for the authenticated user.
*   **Success Response (200 OK)**:
    ```json
    {
      "wallets": [
        {
          "id": 1,
          "name": "Main Wallet",
          "amount": { "amount": 150050, "currency": { "code": "USD" } },
          "number": "ACCT123456",
          "currency": { "code": "USD" },
          "type": "main", // key for wallet type, e.g. "main", "deposit"
          "user": { "id": 1 }
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /wallets/types`
Retrieves available wallet types mapping.
*   **Success Response (200 OK)**:
    ```json
    {
      "types": {
        "main": "MAIN",
        "deposit": "DEPOSIT",
        "archive": "ARCHIVE",
        "block": "BLOCK",
        "cash": "CASH",
        "credit": "CREDIT"
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

### 6. Categories (Hierarchical)

#### `GET /main/categories`
Retrieves main categories along with their subcategories.
*   **Success Response (200 OK)**:
    ```json
    {
      "categories": [
        {
          "id": 1,
          "name": "Food & Dining",
          "icon": "Utensils",
          "color": "#FFD700",
          "subCategories": [
            { "id": 101, "name": "Groceries", "icon": "ShoppingCart", "color": "#FFA500" },
            { "id": 102, "name": "Restaurants", "icon": "Plate", "color": "#FF8C00" }
          ]
        },
        {
          "id": 2,
          "name": "Income",
          "icon": "CircleDollarSign",
          "color": "#32CD32",
          "subCategories": [
            { "id": 201, "name": "Salary", "icon": "Briefcase", "color": "#2E8B57" },
            { "id": 202, "name": "Freelance", "icon": "Laptop", "color": "#90EE90" }
          ]
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `POST /main/categories`
Creates a new main category.
*   **Request Body**:
    ```json
    {
      "name": "New Main Category Name",
      "icon": "LucideIconName", // Optional
      "color": "#RRGGBB" // Optional, hex color code
    }
    ```
*   **Success Response (201 Created)**: Returns the created `MainCategory` object (without subCategories initially).
    ```json
    {
      "id": 3,
      "name": "New Main Category Name",
      "icon": "LucideIconName",
      "color": "#RRGGBB",
      "subCategories": []
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `POST /main/categories/{mainCategoryId}/subcategories`
Creates a new subcategory under a specified main category.
*   **Path Parameter**: `mainCategoryId` (integer)
*   **Request Body**:
    ```json
    {
      "name": "New Subcategory Name",
      "icon": "LucideIconName", // Optional
      "color": "#RRGGBB" // Optional, hex color code
    }
    ```
*   **Success Response (201 Created)**: Returns the created `SubCategory` object.
    ```json
    {
      "id": 301,
      "name": "New Subcategory Name",
      "icon": "LucideIconName",
      "color": "#RRGGBB",
      "mainCategoryId": 3
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found for mainCategoryId)**


## Data Models (PHP Representations - Examples)

Consider these when designing your database and PHP classes/objects.

### User
*   `id` (int, primary key)
*   `login` (string, unique, used for display and actual username)
*   `email` (string, unique)
*   `password_hash` (string)
*   `user_currency_code` (string, e.g., "USD", "EUR")
*   `created_at` (datetime)
*   `updated_at` (datetime)

### Transaction
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `amount_cents` (int)
*   `currency_code` (string, e.g., "USD", related to this specific transaction)
*   `exchange_rate` (decimal/float, if supporting multi-currency conversions)
*   `description` (string, nullable)
*   `type_id` (int, e.g., 1 for INCOME, 2 for EXPENSE - refers to an internal mapping or TransactionType table)
*   `wallet_id` (int, foreign key to Wallet)
*   `subcategory_id` (int, nullable, foreign key to SubCategory)
*   `source` (string, nullable, system-internal or for imports)
*   `transaction_date` (datetime) // The actual date of the transaction event
*   `frequency_id` (string/int, foreign key or reference to a Frequency table/enum, linked to values from `/transactions/frequency`)
*   `created_at` (datetime) // Record creation timestamp
*   `updated_at` (datetime) // Record update timestamp

### TransactionType (Conceptual, might be an ENUM or simple mapping in code, corresponds to `GET /transactions/types`)
*   `id` (string, e.g., "1", "2" - as used by frontend)
*   `name` (string, e.g., "INCOME", "EXPENSE")
*   *(Backend might store `type_id` as an integer that maps to these string IDs internally)*

### FrequencyType (Conceptual, based on `GET /transactions/frequency`)
*   `id` (string, e.g., "1", "5" - as used by frontend)
*   `name` (string, e.g., "ONE_TIME", "MONTHLY")
*   *(Backend might store `frequency_id` that maps to these string IDs internally)*


### Wallet
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `name` (string)
*   `current_balance_cents` (int)
*   `currency_code` (string)
*   `account_number` (string, nullable)
*   `type_key` (string, e.g., "main", "deposit" - links to a wallet_types table/enum from `GET /wallets/types`)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### MainCategory
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User, or null if global)
*   `name` (string)
*   `icon` (string, nullable)
*   `color` (string, nullable, e.g. hex code)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### SubCategory
*   `id` (int, primary key)
*   `main_category_id` (int, foreign key to MainCategory)
*   `name` (string)
*   `icon` (string, nullable)
*   `color` (string, nullable, e.g. hex code)
*   `created_at` (datetime)
*   `updated_at` (datetime)


## Further Considerations

*   **Database**: Choose a suitable database (e.g., MySQL, PostgreSQL).
*   **PHP Framework**: Using a PHP framework (e.g., Laravel, Symfony) is highly recommended to handle routing, ORM, security, etc.
*   **PHP Server Binding for Local Network Access**: When running your PHP development server locally (e.g., using `php -S ...` or Symfony's `symfony server:start`), ensure it's bound to `0.0.0.0` or your specific local network IP, not just `127.0.0.1`. For example:
    `php -S 0.0.0.0:8000`
    Or for Symfony:
    `symfony server:start --port=8000 --allow-http` (Symfony often binds to `0.0.0.0` by default if not specified, but verify).
    This allows other devices on your local network (like your mobile phone) to connect to the backend. If it's bound only to `127.0.0.1`, it will only be accessible from your development PC.
*   **Security**:
    *   Sanitize all user inputs.
    *   Protect against SQL injection, XSS, CSRF.
    *   Use HTTPS for all communications in production.
*   **Validation**: Implement robust server-side validation for all incoming data.
*   **CORS (Cross-Origin Resource Sharing)**:
    *   Configure Cross-Origin Resource Sharing (CORS) headers appropriately in your PHP backend to allow requests from your Next.js frontend domain.
    *   **Development with Mobile**: When testing from a mobile device accessing your Next.js app via your computer's local IP (e.g., `http://192.168.1.100:9002`), your PHP backend's `Access-Control-Allow-Origin` header must explicitly include this origin. Your NelmioCorsBundle configuration provided (`allow_origin: [ '^http://localhost(:[0-9]+)?$', '^http://192.168.0.41(:[0-9]+)?' ]`) seems to address this if `192.168.0.41` is your computer's correct current local IP.
        ```php
        // Example PHP CORS headers (actual implementation depends on framework)

        // For development, you might allow multiple origins or use a wildcard carefully.
        // For production, be very specific.
        $allowed_origins = [
            "http://localhost:9002", // Your Next.js dev server on PC
            "http://<YOUR_COMPUTER_LOCAL_IP_ADDRESS>:9002" // Replace with your PC's actual local IP and Next.js port
        ];
        // Determine the incoming origin
        $http_origin = $_SERVER['HTTP_ORIGIN'] ?? null;

        if ($http_origin && in_array($http_origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: " . $http_origin);
        } else {
            // Optionally, deny requests from other origins or have a default restrictive policy.
            // For wider local testing, you could use: header("Access-Control-Allow-Origin: *");
            // BUT DO NOT USE WILDCARD IN PRODUCTION without understanding security implications.
            header("Access-Control-Allow-Origin: http://localhost:9002"); // Fallback or default
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true"); // If you need to send cookies/auth headers cross-origin

        // Handle OPTIONS preflight requests (crucial for POST with JSON/Authorization)
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(204); // Or 200 OK
            exit();
        }
        ```
    *   **Important for `POST` requests with `Authorization` or `Content-Type: application/json`**: The browser will send an `OPTIONS` preflight request. Your server *must* respond to this `OPTIONS` request with a `200 OK` or `204 No Content` and the correct CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`). If the `OPTIONS` request fails, the browser will block the actual `POST` request.

## Troubleshooting Mobile Connectivity

If you experience "fetch failed" errors or similar issues when accessing the application from a mobile device on your local network, even after configuring `NEXT_PUBLIC_API_BASE_URL` with your computer's local IP:

1.  **Verify IP Address**: Double-check that the IP address used in `NEXT_PUBLIC_API_BASE_URL` is the *current* local IP address of the machine running your PHP backend. IP addresses can change if your network uses DHCP. Ensure this IP matches what's in your backend's CORS `allow_origin` (e.g., `192.168.0.41` in your example).
2.  **PHP Server Binding**: Re-confirm your PHP server (e.g., Symfony's built-in server, `php -S`) is bound to `0.0.0.0:<port>` or `<YOUR_COMPUTER_IP_ADDRESS>:<port>`, not just `127.0.0.1`. If it's bound to `127.0.0.1`, it won't accept external local network connections.
3.  **CORS Configuration (Backend)**:
    *   Ensure your backend's `Access-Control-Allow-Origin` correctly includes the origin from which your mobile device is accessing the Next.js app (e.g., `http://<YOUR_COMPUTER_IP_ADDRESS>:<NEXTJS_PORT>`).
    *   **Crucially, verify your backend correctly handles preflight `OPTIONS` requests for `POST`, `PUT`, `DELETE` operations, returning a `200 OK` or `204 No Content` with necessary CORS headers (`Access-Control-Allow-Methods` including `POST`, `OPTIONS`; `Access-Control-Allow-Headers` including `Content-Type`, `Authorization`).** Your provided NelmioCorsBundle configuration seems to aim for this, but it's essential to confirm it's active and working as expected for the specific mobile origin.
4.  **Mobile Browser Developer Tools**: **This is the most important step.**
    *   Connect your mobile device to your computer via USB.
    *   Use your desktop browser's developer tools to inspect the mobile browser's Network tab and Console.
        *   **Chrome (Android)**: Go to `chrome://inspect` on your desktop Chrome.
        *   **Safari (iOS)**: Enable Web Inspector in Safari settings on your iPhone/iPad, then find it under the Develop menu in Safari on your Mac.
    *   Examine the failed network request (both the `OPTIONS` preflight and the actual `POST` request for login). Look for the exact HTTP status code, response headers, and any console errors (especially CORS errors). This will provide specific clues.
5.  **Firewall**: Check if a firewall on your development machine is blocking incoming connections to your PHP backend's port from other devices on your local network.
6.  **Clear Mobile Browser Cache**: Sometimes, outdated cached responses or service workers can cause issues. Try clearing your mobile browser's cache and data for the site.
7.  **HTTPS vs HTTP Mismatch**: Ensure both frontend and backend are using the same protocol (HTTP for local IP testing is fine, but if one is HTTPS and the other HTTP, it will cause issues).

This documentation provides a starting point. Adapt and expand it based on the full feature set of FinanceFlow.
Check your mobile browser's developer tools (Network and Console tabs) for specific error messages if you encounter issues.

