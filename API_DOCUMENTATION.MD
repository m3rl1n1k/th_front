
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
        "memberSince": "2023-01-15T10:00:00Z",
        "roles": ["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"]
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
      // Optionally, can return the created user object as in GET /user
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

#### `GET /user`
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
      },
      "roles": ["ROLE_USER"]
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
      // Password changes should be handled by POST /user/change-password
    }
    ```
*   **Success Response (200 OK)**: Returns the updated user profile.
    ```json
    {
      "id": 1,
      "login": "new_user_login_name",
      "email": "new_email@example.com",
      "memberSince": "2023-01-15T10:00:00Z",
      "userCurrency": {
        "code": "EUR"
      },
      "roles": ["ROLE_USER"]
    }
    ```
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
*   **Success Response (200 OK or 204 No Content)**:
    ```json
    // Option 1: Simple success message (200 OK)
    {
      "message": "Password changed successfully."
    }
    // Option 2: No content (204 No Content)
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format, e.g., if current password is incorrect or new password doesn't meet criteria.

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
          "date": "2024-07-28T14:30:00Z", // ISO date string
          "frequency": "1" // Frequency identifier
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
        // "3": "TRANSFER" (If applicable)
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
      "frequency": "1" // Actual frequency identifier stored/returned by backend
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
          "frequency": "1"
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /transactions/{id}`
Retrieves a specific transaction by its ID. The response should be `{"transaction": {...}}`.
*   **Success Response (200 OK)**: Single transaction object.
    ```json
    {
      "transaction": {
        "id": 123,
        "amount": { "amount": 5000, "currency": { "code": "USD" } },
        "currency": { "code": "USD" },
        "exchangeRate": 1,
        "type": 2,
        "description": "Groceries",
        "wallet": { "id": 1, "name": "Main", "number": "ACCT123" },
        "subCategory": { "id": 101, "name": "Groceries"},
        "user": { "id": 1 },
        "source": "manual",
        "date": "2024-07-28T14:30:00Z",
        "frequency": "1"
      }
    }
    ```
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
*   **Success Response (200 OK)**: Updated transaction object (same format as `GET /transactions/{id}` response, with `frequency` field).
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
          "number": "ACCT123456", // Note: This field is available in GET response
          "currency": { "code": "USD" },
          "type": "main", // key for wallet type, e.g. "main", "deposit"
          "user": { "id": 1 }
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `POST /wallets`
Creates a new wallet.
*   **Request Body**:
    ```json
    {
      "name": "My New Cash Wallet",
      "amount_cents": 50000, // Initial balance in cents
      "currency": "USD", // Currency code (e.g., USD, EUR)
      "type": "cash" // Wallet type key from GET /wallets/types
    }
    ```
*   **Success Response (201 Created)**: Returns the created wallet object (similar to `GET /wallets` item). The `number` field (account number) is not sent by the client for creation.
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `GET /wallets/{id}`
Retrieves a specific wallet by its ID.
*   **Success Response (200 OK)**: Single wallet object (same format as items in `GET /wallets` list).
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `PUT /wallets/{id}`
Updates a specific wallet.
*   **Request Body**: Similar to `POST /wallets`, containing fields to update. `amount_cents` here represents the new total balance for the wallet. The `number` field (account number) is not sent by the client for updates.
    ```json
    {
      "name": "Updated Wallet Name",
      "amount_cents": 75000, // New balance in cents
      "currency": "EUR",
      "type": "deposit"
    }
    ```
*   **Success Response (200 OK)**: Updated wallet object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /wallets/{id}`
Deletes a specific wallet.
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**

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
        }
        // ... other main categories
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /main/categories/{id}`
Retrieves a specific main category by its ID.
*   **Success Response (200 OK)**:
    ```json
    {
      "category": {
        "id": 1,
        "name": "Food & Dining",
        "icon": "Utensils",
        "color": "#FFD700",
        "user": {
          "id": 1
        },
        "subCategories": [
          { "id": 101, "name": "Groceries", "icon": "ShoppingCart", "color": "#FFA500" },
          { "id": 102, "name": "Restaurants", "icon": "Plate", "color": "#FF8C00" }
        ]
      }
    }
    ```
*   **Failure Response (401 Unauthorized, 404 Not Found)**

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
*   **Success Response (201 Created)**: Returns the created `MainCategory` object (without subCategories initially or with an empty array).
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

#### `PUT /main/categories/{id}`
Updates a specific main category.
*   **Request Body**:
    ```json
    {
      "name": "Updated Main Category Name", // Optional
      "icon": "NewIconName",             // Optional
      "color": "#112233"                 // Optional
    }
    ```
*   **Success Response (200 OK)**: Returns the updated `MainCategory` object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /main/categories/{id}`
Deletes a specific main category. This will likely also delete its associated subcategories (backend logic).
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**


#### `POST /sub/categories`
Creates a new sub category.
*   **Request Body**:
    ```json
    {
      "name": "SubCategory Name",
      "main_category": 1, // ID of the parent MainCategory
      "icon": "LucideIconName", // Optional
      "color": "#RRGGBB" // Optional, hex color code
    }
    ```
*   **Success Response (201 Created)**: Returns the created `SubCategory` object.
    ```json
    {
      "id": 301,
      "name": "SubCategory Name",
      "icon": "LucideIconName",
      "color": "#RRGGBB",
      "main_category_id": 1 // Or similar structure confirming parent
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `PUT /sub/categories/{id}`
Updates a specific subcategory.
*   **Path Parameter**: `id` (integer, ID of the subcategory to update)
*   **Request Body**:
    ```json
    {
      "name": "SubCategory Updated Name", // Optional
      "main_category": 2,               // Optional, ID of the new/current parent MainCategory
      "icon": "NewIconName",            // Optional
      "color": "#AABBCC"                // Optional
    }
    ```
*   **Success Response (200 OK)**: Returns the updated `SubCategory` object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /sub/categories/{id}`
Deletes a specific subcategory.
*   **Path Parameter**: `id` (integer, ID of the subcategory to delete)
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**

### 7. Feedback

#### `POST /feedback`
Allows an authenticated user to submit feedback.
*   **Request Body**:
    ```json
    {
      "type": "BUG_REPORT", // Enum: BUG_REPORT, FEATURE_REQUEST, GENERAL_FEEDBACK, QUESTION
      "subject": "Issue with login button",
      "message": "The login button on the main page doesn't work on mobile."
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "message": "Feedback submitted successfully."
      // Optionally, return the created feedback object
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**: Standard error format.

#### `GET /admin/feedbacks`
Retrieves all submitted feedbacks. Requires `ROLE_MODERATOR_FEEDBACK` role.
*   **Request Body**: None (token in header)
*   **Success Response (200 OK)**:
    ```json
    {
      "feedbacks": [
        {
          "id": 1,
          "type": "BUG_REPORT",
          "subject": "Login issue",
          "message": "Cannot log in on Safari.",
          "createdAt": "2024-08-01T10:00:00Z",
          "user": {
            "id": 5,
            "login": "testuser"
          }
        },
        {
          "id": 2,
          "type": "FEATURE_REQUEST",
          "subject": "Dark mode for reports",
          "message": "It would be great to have dark mode for the reporting section.",
          "createdAt": "2024-08-01T11:30:00Z",
          "user": null // Example of anonymous feedback if supported
        }
        // ... more feedback items
      ]
    }
    ```
*   **Failure Response (401 Unauthorized, 403 Forbidden)**

### 8. Budgets

#### `GET /budgets`
Retrieves a list of budgets for the authenticated user.
*   **Success Response (200 OK)**:
    ```json
    {
      "budgets": [
        {
          "id": "1",
          "month": "2024-08", // Format: YYYY-MM
          "plannedAmount": 500000, // in cents
          "actualExpenses": 350000, // in cents, calculated by backend
          "currencyCode": "USD",
          "category_id": 101 // Optional: ID of the associated SubCategory
        }
        // ... more budget items
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /budgets/{id}`
Retrieves a specific budget by its ID.
*   **Success Response (200 OK)**:
    ```json
    {
      "budget": {
        "id": "1",
        "month": "2024-08",
        "plannedAmount": 500000,
        "actualExpenses": 350000,
        "currencyCode": "USD",
        "category_id": 101 // Optional: ID of the associated SubCategory
        // Potentially more details like category breakdowns if implemented
      }
    }
    ```
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `POST /budgets`
Creates a new budget.
*   **Request Body**:
    ```json
    {
      "month": "2024-09", // YYYY-MM
      "plannedAmount": 600000, // in cents
      "currencyCode": "USD", // Or derive from user's default currency
      "category_id": 101 // integer ID (refers to a subCategory ID), required
    }
    ```
*   **Success Response (201 Created)**: Returns the created budget object.
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `PUT /budgets/{id}`
Updates a specific budget.
*   **Request Body**: (Fields to update)
    ```json
    {
      "plannedAmount": 650000, // in cents
      "category_id": 102 // Optional: new integer ID for subCategory
    }
    ```
*   **Success Response (200 OK)**: Returns the updated budget object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /budgets/{id}`
Deletes a specific budget.
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**


### 9. General

#### `GET /currencies`
Retrieves a list of available currencies.
*   **Success Response (200 OK)**:
    ```json
    {
      "currencies": {
        "uae_dirham": "AED",
        "afghan_afghani": "AFN",
        // ... and so on for all currencies
        "united_states_dollar": "USD",
        "ukrainian_hryvnia": "UAH",
        "polish_zloty": "PLN",
        "euro": "EUR",
        "zimbabwean_dollar": "ZWL"
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**


## Data Models (PHP Representations - Examples)

Consider these when designing your database and PHP classes/objects.

### User
*   `id` (int, primary key)
*   `login` (string, unique, used for display and actual username)
*   `email` (string, unique)
*   `password_hash` (string)
*   `user_currency_code` (string, e.g., "USD", "EUR")
*   `roles` (array of strings, e.g. `["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"]`)
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
*   `frequency` (string/int, backend representation of frequency, linked to values from `/transactions/frequency`)
*   `created_at` (datetime) // Record creation timestamp
*   `updated_at` (datetime) // Record update timestamp

### TransactionType (Conceptual, might be an ENUM or simple mapping in code, corresponds to `GET /transactions/types`)
*   `id` (string, e.g., "1", "2" - as used by frontend)
*   `name` (string, e.g., "INCOME", "EXPENSE")
*   *(Backend might store `type_id` as an integer that maps to these string IDs internally)*

### FrequencyType (Conceptual, based on `GET /transactions/frequency`)
*   `id` (string, e.g., "1", "5" - as used by frontend)
*   `name` (string, e.g., "ONE_TIME", "MONTHLY")
*   *(Backend might store `frequency` as an integer or string that maps to these string IDs internally)*


### Wallet
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `name` (string)
*   `current_balance_cents` (int)
*   `currency_code` (string)
*   `account_number` (string, nullable) // Note: This field is part of the GET response but NOT for POST/PUT from frontend.
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

### Feedback
*   `id` (int, primary key)
*   `user_id` (int, nullable, foreign key to User - null if anonymous)
*   `type` (string, enum: BUG_REPORT, FEATURE_REQUEST, GENERAL_FEEDBACK, QUESTION)
*   `subject` (string, max 255 chars)
*   `message` (text)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### Budget
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `month` (string, "YYYY-MM")
*   `planned_amount_cents` (int)
*   `currency_code` (string)
*   `category_id` (int, foreign key to SubCategory) // Added
*   `created_at` (datetime)
*   `updated_at` (datetime)
    *(Note: `actualExpenses` is typically calculated on-the-fly by summing relevant transactions for the budget's month and user, not stored directly in the budget table.)*


## Further Considerations

*   **Database**: Choose a suitable database (e.g., MySQL, PostgreSQL).
*   **PHP Framework**: Using a PHP framework (e.g., Laravel, Symfony) is highly recommended to handle routing, ORM, security, etc.
*   **PHP Server Binding for Local Network Access (CRUCIAL for Mobile Testing)**:
    *   When running your PHP development server locally (e.g., using `php -S ...` or Symfony's `symfony server:start`), **it MUST be bound to `0.0.0.0` or your specific local network IP, NOT just `127.0.0.1`.** If it's bound to `127.0.0.1`, it will only accept connections from your development PC and will REFUSE connections from other devices on your network like your mobile phone, leading to "Failed to fetch" errors.
    *   Example for built-in PHP server: `php -S 0.0.0.0:8000` (replace `8000` with your backend port).
    *   For Symfony: `symfony server:start --port=8000 --allow-http` (Symfony often defaults to `0.0.0.0`, but verify. The `--allow-http` is also important for local network access if not using HTTPS locally).
*   **Security**:
    *   Sanitize all user inputs.
    *   Protect against SQL injection, XSS, CSRF.
    *   Use HTTPS for all communications in production.
*   **Validation**: Implement robust server-side validation for all incoming data.
*   **CORS (Cross-Origin Resource Sharing)**:
    *   Configure Cross-Origin Resource Sharing (CORS) headers appropriately in your PHP backend to allow requests from your Next.js frontend domain.
    *   **Development with Mobile**: When testing from a mobile device accessing your Next.js app via your computer's local IP (e.g., `http://192.168.1.100:9002`), your PHP backend's `Access-Control-Allow-Origin` header must explicitly include this origin. Your NelmioCorsBundle configuration (`allow_origin: [ ..., '^http://192.168.0.41(:[0-9]+)?' ]`) seems to address this if `192.168.0.41` is your computer's correct current local IP and your Next.js app is accessed from a URL matching this pattern.
        ```php
        // Example PHP CORS headers (actual implementation depends on framework)

        // For development, you might allow multiple origins or use a wildcard carefully.
        // For production, be very specific.
        $allowed_origins = [
            "http://localhost:9002", // Your Next.js dev server on PC
            "http://<YOUR_COMPUTER_LOCAL_IP_ADDRESS>:<NEXTJS_PORT>" // Replace with your PC's actual local IP and Next.js port
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

## Troubleshooting Mobile Connectivity ("Failed to fetch" or similar errors)

If you experience "Failed to fetch" errors or similar network issues when accessing the application from a mobile device on your local network, even after configuring `NEXT_PUBLIC_API_BASE_URL` with your computer's local IP, follow these steps methodically:

1.  **Verify IP Address & `NEXT_PUBLIC_API_BASE_URL`**:
    *   **Confirm your PC's current local IP address.** (e.g., using `ipconfig` on Windows or `ifconfig`/`ip addr` on macOS/Linux). IP addresses can change if your network uses DHCP.
    *   Ensure this exact IP address and your PHP backend's port are correctly set in `NEXT_PUBLIC_API_BASE_URL` in your `.env.local` file (e.g., `NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:8000/api`).
    *   Restart your Next.js development server after changing `.env.local`.

2.  **PHP Backend Server Binding (CRITICAL for "Failed to fetch")**:
    *   **Re-confirm your PHP server (e.g., Symfony's built-in server, `php -S`) is bound to `0.0.0.0:<port>` or `<YOUR_COMPUTER_IP_ADDRESS>:<port>`, NOT just `127.0.0.1`.**
    *   If it's bound only to `127.0.0.1`, it will only accept connections from your development PC itself and will *refuse* connections from your mobile phone, leading to a "Failed to fetch" error. The browser won't even get a chance to make a CORS preflight request.
    *   For Symfony: `symfony server:start --port=8000 --allow-http` (or your backend port). The `--allow-http` is important.
    *   For PHP built-in: `php -S 0.0.0.0:8000`

3.  **Firewall on Development PC**:
    *   Temporarily disable any firewalls on your development PC (Windows Firewall, macOS Firewall, third-party antivirus/firewall) to see if this resolves the issue.
    *   If it does, re-enable the firewall and add a specific inbound rule to allow connections to your PHP backend's port (e.g., 8000) from your local network.

4.  **CORS Configuration (Backend)**:
    *   Ensure your backend's `Access-Control-Allow-Origin` in your Nelmio CORS bundle configuration (or equivalent) correctly includes the origin from which your mobile device is accessing the Next.js app (e.g., `^http://<YOUR_COMPUTER_IP_ADDRESS>:<NEXTJS_PORT>`).
    *   **Verify your backend correctly handles preflight `OPTIONS` requests** for `POST`, `PUT`, `DELETE` operations, returning a `200 OK` or `204 No Content` with necessary CORS headers. Your provided NelmioCorsBundle configuration aims for this, but it's essential to confirm it's active and working as expected for the specific mobile origin using the Mobile Browser Developer Tools.

5.  **Mobile Browser Developer Tools (ESSENTIAL for diagnosis)**:
    *   This is the most important step to get specific error details.
    *   Connect your mobile device to your computer via USB.
    *   Use your desktop browser's developer tools to inspect the mobile browser's Network tab and Console.
        *   **Chrome (Android)**: Go to `chrome://inspect` on your desktop Chrome. Find your device and the open tab, then click "inspect."
        *   **Safari (iOS)**: Enable Web Inspector in Safari settings on your iPhone/iPad (Settings > Safari > Advanced > Web Inspector). Then, in Safari on your Mac, go to Develop > [Your iPhone Name] > [Your Tab].
    *   **Examine the failed network request in the Network Tab**:
        *   Look for the `login_check` (or other failing) request.
        *   Is there an `OPTIONS` preflight request immediately before it? What is its status code? (Should be 200 or 204).
        *   What is the status of the actual `POST` (or other) request? Is it `(failed)` (indicating a network level issue like "connection refused"), or does it show an HTTP error code (e.g., 401, 403, 500)?
        *   Check the "Headers" tab for both the request and response to see what's being sent and received.
    *   **Check the Console Tab**: Look for any error messages, especially CORS errors (e.g., "Access to fetch at '...' from origin '...' has been blocked by CORS policy..."). These messages are usually very specific.

6.  **Clear Mobile Browser Cache**: Sometimes, outdated cached responses or service workers can cause issues. Try clearing your mobile browser's cache and data for the site.

7.  **HTTPS vs HTTP Mismatch**: Ensure both frontend and backend are using the same protocol (HTTP for local IP testing is fine, but if one is HTTPS and the other HTTP, it will cause issues).

By systematically checking these points and using the mobile browser's developer tools, you should be able to identify the root cause of the "Failed to fetch" error.
Check your mobile browser's developer tools (Network and Console tabs) for specific error messages if you encounter issues.

