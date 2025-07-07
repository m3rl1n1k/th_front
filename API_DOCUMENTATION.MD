
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
        "verifiedAt": "2025-05-28T21:44:05+00:00",
        "memberSince": "2023-01-15T10:00:00Z",
        "userCurrency": {
           "code": "USD"
        },
        "roles": ["ROLE_USER"],
        "userSetSecret": true,
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
      "verifiedAt": "2025-05-28T21:44:05+00:00",
      "memberSince": "2023-01-15T10:00:00Z",
      "userCurrency": {
        "code": "USD"
      },
      "roles": ["ROLE_USER"],
      "userSetSecret": true,
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
      "userCurrencyCode": "EUR",
      "user_secret": "my-super-secret-phrase-for-api"
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

#### `GET /dashboard/total-balance`
Retrieves the user's total balance across all wallets.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "total_balance": 1234567
    }
    ```

#### `GET /dashboard/main-wallet-balance`
Retrieves the balance of the user's designated "main" wallet.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "main_wallet_balance": 543210
    }
    ```

#### `GET /dashboard/monthly-income`
Retrieves the total income for the current calendar month.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "month_income": 800000
    }
    ```

#### `GET /dashboard/average-expenses`
Retrieves total expenses for the current calendar month.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "month_expense": 450000
    }
    ```

#### `GET /dashboard/chart/total-expense`
Retrieves a summary of expenses for the current month, grouped by category, for use in a chart.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "month_expense_chart": {
        "Groceries": { "amount": 15000, "color": "#10b981" },
        "Utilities": { "amount": 5000, "color": "#f59e0b" },
        "Transport": { "amount": 8000, "color": "#3b82f6" }
      }
    }
    ```

#### `GET /dashboard/last-transactions/{limit}`
Retrieves the last `N` transactions for the user.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `limit` (integer): The maximum number of transactions to return.
*   **Success Response (200 OK)**:
    ```json
    {
      "last_transactions": [
      ]
    }
    ```

### 4. Transactions

**Transaction Object Structure**
```json
{
    "id": 1,
    "amount": {
        "amount": 5000,
        "currency": {
            "code": "USD"
        }
    },
    "currency": {
        "code": "USD"
    },
    "exchangeRate": 1,
    "type": 2,
    "description": "Lunch with colleagues",
    "wallet": {
        "id": 1,
        "name": "Main Checking Account"
    },
    "subCategory": {
        "id": 5,
        "name": "Restaurants"
    },
    "date": "2024-07-29T12:30:00Z",
    "isRecurring": false,
    "frequency": null
}
```

#### `GET /transactions`
Retrieves a paginated list of transactions. Can be filtered.
*   **Authentication**: Required.
*   **Query Parameters**:
    *   `page` (integer, optional): The page number to retrieve.
    *   `startDate` (string, optional): Format `YYYY-MM-DD`.
    *   `endDate` (string, optional): Format `YYYY-MM-DD`.
    *   `categoryId` (integer, optional): ID of a sub-category.
    *   `typeId` (integer, optional): ID of a transaction type.
*   **Success Response (200 OK)**:
    ```json
    {
      "transactions": {
        "items": [],
        "pagination": {
            "page": 1,
            "per_page": 20,
            "total_pages": 5,
            "total_items": 98
        }
      }
    }
    ```

#### `POST /transactions`
Creates a new transaction.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
        "amount": 5000,
        "description": "Weekly grocery shopping",
        "typeId": "2",
        "date": "2024-07-29",
        "wallet_id": 1,
        "category_id": 4,
        "frequencyId": "0"
    }
    ```
*   **Success Response (201 Created)**: Returns the created Transaction object.

#### `GET /transactions/{id}`
Retrieves a single transaction by its ID.
*   **Authentication**: Required.
*   **Success Response (200 OK)**: Returns a single Transaction object wrapped in a `transaction` key.
    ```json
    {
        "transaction": { }
    }
    ```

#### `PUT /transactions/{id}`
Updates an existing transaction.
*   **Authentication**: Required.
*   **Request Body**: Same as `POST /transactions`.
*   **Success Response (200 OK)**: Returns the updated Transaction object wrapped in a `transaction` key.

#### `DELETE /transactions/{id}`
Deletes a transaction.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

#### `GET /transactions/types`
Retrieves all possible transaction types.
*   **Authentication**: Required.
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

#### `GET /transactions/frequency`
Retrieves all possible recurrence frequencies.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
        "periods": {
            "0": "ONE_TIME",
            "1": "DAILY",
            "2": "WEEKLY",
            "3": "EVERY_TWO_WEEKS",
            "4": "MONTHLY",
            "5": "EVERY_6_MONTHS",
            "6": "YEARLY"
        }
    }
    ```

### 5. Wallets

#### `GET /wallets`
Retrieves a list of all wallets for the authenticated user.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "wallets": [
        {
          "id": 1,
          "name": "Main Checking",
          "amount": { "amount": 123450, "currency": { "code": "USD" } },
          "number": " **** 1234",
          "currency": { "code": "USD" },
          "type": "main",
          "user": { "id": 1 }
        }
      ]
    }
    ```

#### `POST /wallets`
Creates a new wallet.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
        "name": "Vacation Fund",
        "amount_cents": 50000,
        "currency": "USD",
        "type": "deposit"
    }
    ```
*   **Success Response (201 Created)**: Returns the created Wallet object.

#### `GET /wallets/types`
Retrieves all possible wallet types.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "types": {
        "main": "MAIN",
        "deposit": "DEPOSIT",
        "cash": "CASH",
        "credit": "CREDIT",
        "archive": "ARCHIVE",
        "block": "BLOCK"
      }
    }
    ```

#### `GET /wallets/{id}`
Retrieves a single wallet by its ID.
*   **Authentication**: Required.
*   **Success Response (200 OK)**: Returns a single Wallet object.

#### `PUT /wallets/{id}`
Updates an existing wallet.
*   **Authentication**: Required.
*   **Request Body**: Same as `POST /wallets`.
*   **Success Response (200 OK)**: Returns the updated Wallet object.

#### `DELETE /wallets/{id}`
Deletes a wallet.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

### 6. Categories

#### `GET /main/categories`
Retrieves all main categories and their sub-categories.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "categories": [
        {
          "id": 1,
          "name": "Shopping",
          "icon": "ShoppingCart",
          "color": "#f59e0b",
          "subCategories": [
            { "id": 10, "name": "Clothes", "icon": "Shirt", "color": "#fbbf24" }
          ]
        }
      ]
    }
    ```

#### `POST /main/categories`
Creates a new main category.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    { "name": "Housing", "icon": "Home", "color": "#3b82f6" }
    ```
*   **Success Response (201 Created)**: Returns the created Main Category object.

#### `GET /main/categories/{id}`
Retrieves a single main category.
*   **Authentication**: Required.
*   **Success Response (200 OK)**: Returns a Main Category object wrapped in a `category` key.

#### `PUT /main/categories/{id}`
Updates a main category.
*   **Authentication**: Required.
*   **Request Body**: Same as `POST /main/categories`.
*   **Success Response (200 OK)**: Returns the updated Main Category object.

#### `DELETE /main/categories/{id}`
Deletes a main category and all its sub-categories.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

#### `POST /sub/categories`
Creates a new sub-category.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "name": "Rent",
      "main_category": 1,
      "icon": null,
      "color": null
    }
    ```
*   **Success Response (201 Created)**: Returns the created Sub-Category object.

#### `PUT /sub/categories/{id}`
Updates a sub-category.
*   **Authentication**: Required.
*   **Request Body**: Same as `POST /sub/categories`.
*   **Success Response (200 OK)**: Returns the updated Sub-Category object.

#### `DELETE /sub/categories/{id}`
Deletes a sub-category.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

### 7. Budgets

#### `GET /budgets`
Retrieves a summary of budgets grouped by month.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
        "budgets": {
            "2025-07": {
                "totalPlanned": { "amount": 250000, "currency": { "code": "USD" } },
                "totalActual": { "amount": 180000, "currency": { "code": "USD" } }
            }
        }
    }
    ```

#### `GET /budgets/summary/{date}`
Retrieves a detailed breakdown of a specific month's budget by category.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `date`: The month and year in `YYYY-MM` format.
*   **Success Response (200 OK)**:
    ```json
    {
        "categories": {
            "5": {
                "id": "5",
                "name": "Groceries",
                "plannedAmount": { "amount": 50000, "currency": { "code": "USD" } },
                "actualAmount": { "amount": 45000, "currency": { "code": "USD" } },
                "budgetId": 12
            }
        }
    }
    ```

#### `GET /budgets/summary/{date}/{id}`
Retrieves a single budget item for editing.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `date`: The month and year in `YYYY-MM` format.
    *   `id`: The budget item ID.
*   **Success Response (200 OK)**: Returns an array with a single budget item.
    ```json
    [
        {
            "id": 12,
            "subCategory": { "id": 5, "name": "Groceries" },
            "plannedAmount": { "amount": 50000, "currency": { "code": "USD" } },
            "month": "2025-07",
            "currency": { "code": "USD" }
        }
    ]
    ```

#### `POST /budgets`
Creates a new budget item for a specific month and category.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
        "month": "2025-08",
        "plannedAmount": 60000,
        "currencyCode": "USD",
        "category_id": 5
    }
    ```
*   **Success Response (201 Created)**: Returns the created budget item.

#### `PUT /budgets/summary/{date}/{id}`
Updates a single budget item.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `date`: The month and year in `YYYY-MM` format.
    *   `id`: The budget item ID.
*   **Request Body**:
    ```json
    {
        "plannedAmount": 65000,
        "category_id": 5
    }
    ```
*   **Success Response (200 OK)**: Returns the updated budget item.

#### `DELETE /budgets/{date}`
Deletes a single budget item from a month's budget.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `date`: The month and year in `YYYY-MM` format.
*   **Request Body**:
    ```json
    {
        "id": 12
    }
    ```
*   **Success Response (204 No Content)**

#### `DELETE /budgets/{monthYear}`
Deletes all budget items for a given month.
*   **Authentication**: Required.
*   **URL Parameters**:
    *   `monthYear`: The month and year in `YYYY-MM` format.
*   **Success Response (204 No Content)**

### 8. Recurring Transactions

#### `GET /repeated-transactions`
Retrieves a list of all recurring transaction definitions for the user.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "repeated_transactions": [
        {
          "id": 1,
          "transaction": { "id": 101, "description": "Netflix Subscription" },
          "status": 1,
          "frequency": "4",
          "createdAt": "2024-01-01T10:00:00Z",
          "nextExecution": "2024-08-01T10:00:00Z"
        }
      ]
    }
    ```

#### `GET /transactions/repeated/{id}/status/toggle`
Toggles the status (active/inactive) of a recurring transaction definition.
*   **Authentication**: Required.
*   **URL Parameters**: `id` of the recurring definition.
*   **Success Response (200 OK)**: Returns the updated recurring definition object.

#### `DELETE /transactions/repeated/{id}`
Deletes a recurring transaction definition. This does not delete past transactions created by it.
*   **Authentication**: Required.
*   **URL Parameters**: `id` of the recurring definition.
*   **Success Response (204 No Content)**

### 9. Transfers
#### `GET /transfer/form-data`
Retrieves the necessary data for the transfer form, including user's wallets and wallets from their capital group.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "user_wallets": [
        { "id": 1, "name": "My Checking", "amount": { "amount": 100000 }, "currency": { "code": "USD" } }
      ],
      "capital_wallets": {
        "partner_login": [
          { "id": 5, "name": "Partner Savings", "amount": { "amount": 500000 }, "currency": { "code": "USD" } }
        ]
      }
    }
    ```

#### `GET /transfers`
Retrieves a list of past transfers.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "transfers": [
        {
          "id": 1,
          "outcomeWallet": { "id": 1, "name": "My Checking", "currency": { "code": "USD" } },
          "incomeWallet": { "id": 5, "name": "Partner Savings", "currency": { "code": "USD" } },
          "amount": 10000,
          "createdAt": "2024-07-29T15:00:00Z"
        }
      ]
    }
    ```

#### `POST /transfers`
Creates a new transfer between wallets.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "outcome_wallet_id": 1,
      "income_wallet_id": 5,
      "amount_cents": 10000
    }
    ```
*   **Success Response (201 Created)**: Returns the created Transfer object.

#### `DELETE /transfers/{id}`
Deletes a transfer record.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

### 10. User Settings

#### `POST /settings`
Updates the user's settings. Send only the keys that need to be changed.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "chart_income_color": "#10b981",
      "chart_expense_color": "#ef4444",
      "chart_capital_color": "#f59e0b",
      "records_per_page": 20
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "settings": {
      }
    }
    ```

### 11. Capital & Invitations

#### `GET /capital`
Retrieves detailed information about the capital group the authenticated user belongs to.
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
        "total_capital_sum": 500000,
        "user_capital_sum": 200000,
        "expenses_by_categories": {
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

#### `POST /capitals`
Creates a new capital group.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
        "name": "My Capital Group"
    }
    ```
*   **Success Response (201 Created)**: Returns the created Capital Details object.

#### `DELETE /capital/{capitalId}`
Deletes a capital group. Only the owner can perform this action.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

#### `DELETE /capital/user/{userId}/remove`
Removes a user from a capital group. The owner can remove any member. Members can remove themselves.
*   **Authentication**: Required.
*   **Success Response (204 No Content)**

#### `GET /invitations`
Retrieves lists of invitations sent to and by the user.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "invitation": [],
      "invitation_list": []
    }
    ```
    
#### `POST /capital/{capitalId}/invite`
Invites a user to a capital group.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "invited": "invited_user@example.com",
      "capital_id": 1
    }
    ```
*   **Success Response (201 Created)**: Returns the created Invitation object.
    
#### `POST /invitation/{invitationId}/accept`
Accepts an invitation to join a capital group.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "capital_invitation": 123
    }
    ```
*   **Success Response (200 OK)**: Returns a success message.
    
#### `POST /invitation/{invitationId}/reject`
Rejects an invitation to join a capital group.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "capital_invitation": 123
    }
    ```
*   **Success Response (200 OK)**: Returns a success message.

### 12. Subscriptions (Stripe)

#### `POST /subscription/checkout-session`
Creates a Stripe Checkout session for a user to purchase a subscription.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "price_id": "price_1..."
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "sessionId": "cs_test_a1..."
    }
    ```
*   **Failure Response**: `400`, `401`.

#### `POST /subscription/portal-session`
Creates a Stripe Customer Portal session for a user to manage their existing subscription.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "url": "https://billing.stripe.com/p/session/..."
    }
    ```
*   **Failure Response**: `400`, `401`.

#### Stripe Webhooks `POST /webhooks/stripe`
The backend must implement a webhook endpoint to receive events from Stripe. The endpoint must handle events like `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed` to keep the user's subscription status in sync. This endpoint does not require JWT authentication but should be protected using Stripe's webhook signature verification.

### 13. Feedbacks

#### `GET /feedbacks`
Retrieves a list of feedbacks. Admins can see all, users can see their own.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "feedbacks": []
    }
    ```
    
#### `POST /feedbacks`
Submits new feedback.
*   **Authentication**: Required.
*   **Request Body**:
    ```json
    {
      "type": "BUG_REPORT",
      "subject": "App crashes on login",
      "message": "When I try to log in, the app closes unexpectedly."
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    { "message": "Feedback submitted successfully" }
    ```
    
#### `PUT /feedbacks/{id}`
Updates the status of a feedback item (Admin only).
*   **Authentication**: Required (with admin role).
*   **Request Body**:
    ```json
    { "status": "active" }
    ```
*   **Success Response (200 OK)**: Returns the updated Feedback object.

#### `DELETE /remove-feedback/{id}`
Deletes a feedback item (Admin only).
*   **Authentication**: Required (with admin role).
*   **Success Response (204 No Content)**

### 14. General

#### `GET /currencies`
Retrieves a list of all supported currencies.
*   **Authentication**: Required.
*   **Success Response (200 OK)**:
    ```json
    {
      "currencies": {
        "uae_dirham": "AED",
        "afghan_afghani": "AFN"
      }
    }
    ```
    
#### `GET /report-data`
Retrieves data for the general report page.
*   **Authentication**: Required.
*   **Query Parameters**:
    *   `year` (integer): e.g., 2025
    *   `month` (integer): e.g., 7 for July
*   **Success Response (200 OK)**: Returns a composite object with report statistics, yearly summary, and category summary.

### 15. Application Tokens

#### `POST /generate-app-token`
Generates a new application token for the authenticated user for API access.
*   **Authentication**: Required.
*   **Request Body**: None.
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "App token generated successfully",
      "token": {
        "token": "app_8CKRqoLPyV6qSypfUG3zRoRhZw1NfyIH28lak9SjMqf1lZAtMKGUn4J6L6gBXmJIghwsITFnyml0+dEmds4IwOkEeqjzq5fWMqvkLVLRUVOJqMujnqjgd4D6MrAutmjT_token",
        "scopes": [
          "transaction_write"
        ],
        "isRevoked": false,
        "createdAt": "2025-07-07T16:02:12+00:00"
      }
    }
    ```
*   **Failure Response**: `401`, `500`.
