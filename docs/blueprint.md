# **App Name**: FinanceFlow

## Core Features:

- URL Configuration: Implement a configuration file (.env.urls) to store all URLs used in the application, facilitating easy management and updates of API endpoints.
- User Authentication: User authentication system that allows users to log in using their email address, which is then associated with a username. Upon successful login, the user's login name (user.login) is displayed in the top panel. This feature relies on API calls to the backend.
- Multi-Language Support: Implement multi-language translation support to cater to a global audience. Include a loading indicator that blocks activity during language changes to prevent inconsistencies. This includes translations for the loading indicators.
- User Profile: A user profile page that allows users to view and manage their account information. This interacts with the API to fetch and update user data.
- Dashboard Cards: Display cards on the dashboard showing the total sum of wallets (total_balance), monthly income (month_income), and average expense (day, week, month), calculated from the total monthly expenses (month_expense) received from the server via API. The app must handle amounts in cents.
- Transaction Management: Transaction page with a toggle option to create recurring transactions.  This interacts with the API to create and manage transactions.
- Transaction Type Management: Form to create new transaction types, fetching available types (INCOME, EXPENSE) from the server via API. Default selection for new transactions is EXPENSE.
- JWT Token Setting: Page to manually set a JWT token for development purposes, removing all mock/demo data. The loader must turn off after token setting.
- Auto-Close Menu: Close the menu automatically after a user clicks on a navigation item.
- Loading Indicators: Add a loading indicator when a user clicks a button or URL, which disappears after the page loads.

## Style Guidelines:

- Primary color: HSL(210, 70%, 50%) which becomes RGB(#3399FF). This blue offers a sense of financial tech and stability without being overly conventional.
- Background color: HSL(210, 20%, 95%) which becomes RGB(#F0F5FF).  A very light tint of blue keeps the theme consistent and easy on the eyes.
- Accent color: HSL(180, 60%, 40%) which becomes RGB(#33CCCC). A contrasting cyan color draws attention to interactive elements and important information.
- Headline font: 'Space Grotesk' sans-serif. A modern font suitable for financial data. Paired with 'Inter' for body text.
- Body font: 'Inter' sans-serif. Clean and readable, perfect for transaction details and user information.
- Code font: 'Source Code Pro' monospaced, for any config examples in the documentation file
- Optimize the layout for mobile use, ensuring that the app is fully responsive without requiring zoom functionality.
- Implement loaders that block activity and prevent further action when the language is changed or a URL is clicked, which disappear once the page is loaded.
- Incorporate relevant icons to visually represent financial transactions, types, and other functionalities to improve usability and engagement.