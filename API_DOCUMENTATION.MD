
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
      "roles": ["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"]
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
      "roles": ["ROLE_USER", "ROLE_MODERATOR_FEEDBACK"]
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
Retrieves a summary of budgets grouped by month for the authenticated user.
*   **Success Response (200 OK)**:
    ```json
    {
      "budgets": {
        "2025-06": {
          "totalPlanned": { "amount": 1240815, "currency": { "code": "PLN" } },
          "totalActual": { "amount": 100000, "currency": { "code": "PLN" } }
        },
        "2025-05": {
          "totalPlanned": { "amount": 100000, "currency": { "code": "PLN" } },
          "totalActual": { "amount": 0, "currency": { "code": "PLN" } }
        }
        // ... other months
      }
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `GET /budgets/summary/{date}/{id}`
Retrieves a specific budget item by its ID for a given month and year (YYYY-MM).
*   **Success Response (200 OK)**:
    ```json
    [{
      "id": 123, // Budget item ID
      "subCategory": {
        "id": 101,
        "name": "Groceries"
      },
      "plannedAmount": {
        "amount": 50000, // in cents
        "currency": { "code": "USD" }
      },
      "month": "2024-08",
      "currency": { "code": "USD" }
    }]
    ```
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `POST /budgets`
Creates a new budget item for a specific category within a month.
*   **Request Body**:
    ```json
    {
      "month": "2024-09", // YYYY-MM
      "plannedAmount": 600000, // in cents
      "currencyCode": "USD", // Currency code for this budget item
      "category_id": 101 // integer ID (refers to a subCategory ID), required
    }
    ```
*   **Success Response (201 Created)**: Returns the created budget object (similar structure to `GET /budgets/summary/{date}/{id}` response item).
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `PUT /budgets/summary/{date}/{id}`
Updates a specific budget item.
*   **Path Parameter**: `date` (YYYY-MM), `id` (ID of the specific budget item to update)
*   **Request Body**: (Fields to update)
    ```json
    {
      "plannedAmount": 650000, // in cents
      "category_id": 102 // Optional: new integer ID for subCategory
    }
    ```
*   **Success Response (200 OK)**: Returns the updated budget object.
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found)**

#### `DELETE /budgets/{date}/{id}`
Deletes a specific budget item.
*   **Path Parameter**: `date` (YYYY-MM), `id` (ID of the specific budget item to delete)
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `DELETE /budgets/{monthYear}`
Deletes all budget items for a specific month.
*   **Path Parameter**: `monthYear` (YYYY-MM)
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 404 Not Found)**


#### `GET /budgets/summary/{monthYear}`
Retrieves budget summary by categories for a specific month.
*   **Path Parameter**: `monthYear` (string, YYYY-MM)
*   **Success Response (200 OK)**:
    ```json
    {
        "categories": {
            "101": { // SubCategory ID as key
                "id": "101",
                "name": "Groceries",
                "plannedAmount": {"amount": 50000, "currency": {"code": "USD"}},
                "actualAmount": {"amount": 35000, "currency": {"code": "USD"}},
                "budgetId": 123 // ID of the budget item itself
            }
            // ... other categories for the month
        }
    }
    ```
*   **Failure Response (401 Unauthorized, 404 Not Found)**

### 9. Capital & Invitations

#### `POST /capitals`
Creates a new shared capital pool.
*   **Request Body**:
    ```json
    {
      "name": "Family Savings"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "capital": {
        "id": 1,
        "name": "Family Savings",
        "owner": {
          "id": 1,
          "email": "owner@example.com",
          "login": "OwnerUser"
        },
        "users": [ // Initially, only the owner
          {
            "id": 1,
            "email": "owner@example.com",
            "login": "OwnerUser"
          }
        ]
      }
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized)**

#### `GET /capital/{capitalId}`
Retrieves details of a specific shared capital pool.
*   **Path Parameter**: `capitalId` (integer)
*   **Success Response (200 OK)**:
    ```json
    {
      "capital": {
        "id": 1,
        "name": "Family Savings",
        "owner": {
          "id": 1,
          "email": "owner@example.com",
          "login": "OwnerUser"
        },
        "users": [
          {
            "id": 1,
            "email": "owner@example.com",
            "login": "OwnerUser"
          },
          {
            "id": 2,
            "email": "shared@example.com",
            "login": "SharedUser"
          }
        ]
      }
    }
    ```
*   **Failure Response (401 Unauthorized, 404 Not Found)**

#### `DELETE /capital/{capitalId}`
Deletes a specific shared capital pool. Only the owner can delete it.
*   **Path Parameter**: `capitalId` (integer)
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 403 Forbidden, 404 Not Found)**

#### `DELETE /capital/user/{userId}/remove`
Removes a user from a shared capital pool. (The owner can remove others; a user can remove themselves).
*   **Path Parameter**: `userId` (integer)
*   **Note**: The backend determines which capital pool the authenticated user (making the request) is acting upon, or which capital the `userId` belongs to if an owner is removing someone.
*   **Success Response (204 No Content)**
*   **Failure Response (401 Unauthorized, 403 Forbidden, 404 Not Found)**

#### `GET /invitations`
Retrieves a list of invitations related to the authenticated user (sent by them or sent to them).
*   **Success Response (200 OK)**:
    ```json
    {
      "invitations": [
        {
          "id": 1,
          "invited_email": "friend@example.com",
          "capital_id": 1,
          "capital_name": "Family Savings",
          "status": "pending",
          "inviter_email": "owner@example.com",
          "created_at": "2024-08-15T10:00:00Z"
        }
      ]
    }
    ```
*   **Failure Response (401 Unauthorized)**

#### `POST /capital/{capitalId}/invite`
Invites a user to a shared capital pool.
*   **Path Parameter**: `capitalId` (integer)
*   **Request Body**:
    ```json
    {
      "invited": "friend@example.com", // Email of the user to invite
      "capital_id": 1 // Should match path parameter, for backend validation
    }
    ```
*   **Success Response (201 Created)**: Returns the created invitation object.
    ```json
    {
      "id": 2,
      "invited_email": "friend@example.com",
      "capital_id": 1,
      "status": "pending",
      "inviter_email": "current_user_email@example.com",
      "created_at": "2024-08-16T10:00:00Z"
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found for capital)**

#### `POST /invitation/{invitationId}/accept`
Accepts an invitation to join a shared capital pool.
*   **Path Parameter**: `invitationId` (integer)
*   **Request Body**:
    ```json
    {
      "capital_invitation": 1 // ID of the invitation
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Invitation accepted successfully."
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found for invitation)**

#### `POST /invitation/{invitationId}/reject`
Rejects an invitation to join a shared capital pool.
*   **Path Parameter**: `invitationId` (integer)
*   **Request Body**:
    ```json
    {
      "capital_invitation": 1 // ID of the invitation
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Invitation rejected successfully."
    }
    ```
*   **Failure Response (400 Bad Request, 401 Unauthorized, 404 Not Found for invitation)**

### 10. General

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

### Feedback
*   `id` (int, primary key)
*   `user_id` (int, nullable, foreign key to User - null if anonymous)
*   `type` (string, enum: BUG_REPORT, FEATURE_REQUEST, GENERAL_FEEDBACK, QUESTION)
*   `subject` (string, max 255 chars)
*   `message` (text)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### Budget (Individual Item)
*   `id` (int, primary key)
*   `user_id` (int, foreign key to User)
*   `month` (string, "YYYY-MM")
*   `planned_amount_cents` (int)
*   `currency_code` (string) // e.g., "USD", "PLN"
*   `category_id` (int, foreign key to SubCategory)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### SharedCapital
*   `id` (int, primary key)
*   `name` (string)
*   `owner_user_id` (int, foreign key to User)
*   `created_at` (datetime)
*   `updated_at` (datetime)

### CapitalUserLink (Pivot table for many-to-many relationship between SharedCapital and User)
*   `capital_id` (int, foreign key to SharedCapital)
*   `user_id` (int, foreign key to User)
*   `role` (string, e.g., 'owner', 'participant' - though owner is also on SharedCapital)
    *(Note: Individual financial contributions to the shared pool would need another table or logic, not detailed by current API response for `GET /capital/{id}`)*

### CapitalInvitation
*   `id` (int, primary key)
*   `capital_id` (int, foreign key to SharedCapital)
*   `inviter_user_id` (int, foreign key to User)
*   `invited_email` (string)
*   `status` (string, e.g., 'pending', 'accepted', 'rejected')
*   `token` (string, unique, for invitation link - optional if handled by ID)
*   `created_at` (datetime)
*   `expires_at` (datetime, optional)


## Further Considerations

*   **Database**: Choose a suitable database (e.g., MySQL, PostgreSQL).
*   **PHP Framework**: Using a PHP framework (e.g., Laravel, Symfony) is highly recommended to handle routing, ORM, security, etc.
*   **PHP Server Binding for Local Network Access (CRUCIAL for Mobile Testing)**:
    *   When running your PHP development server locally (e.g., using `php -S ...` or Symfony's `symfony server:start`), **it MUST be bound to `0.0.0.0` or your specific local network IP, NOT just `127.0.0.1`.**
*   **Security**: Sanitize all user inputs, protect against SQL injection, XSS, CSRF. Use HTTPS in production.
*   **Validation**: Implement robust server-side validation.
*   **CORS**: Configure Cross-Origin Resource Sharing headers.
*   **Troubleshooting Mobile Connectivity**: Refer to detailed steps in the original `API_DOCUMENTATION.md` if "Failed to fetch" errors occur during mobile testing.

```