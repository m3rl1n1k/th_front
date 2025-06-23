# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Development

To run the app in development mode:

```bash
npm run dev
```

This will start the development server on `http://localhost:9002`.

## Production

To prepare your application for production, follow these steps:

### 1. Environment Variables

Create a `.env.local` file in the root of your project and add your production API endpoint. This file is ignored by Git and should not be committed.

```
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api
```

### 2. Build the Application

Run the following command to create an optimized production build:

```bash
npm run build
```

This command will lint your code, check for TypeScript errors, and create a production-ready build in the `.next` folder.

### 3. Run in Production Mode

To start the production server, run:

```bash
npm run start
```

This will serve your application from the production build.
