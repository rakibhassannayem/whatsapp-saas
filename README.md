This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Structure

- `src/app/` contains Next.js route entry points, layouts, and API route handlers.
- `src/components/pages/` groups each page implementation and its page-specific components by route, such as `customers/new` and `campaigns/campaign-details`.
- `src/components/auth/` and `src/components/dashboard/` contain components shared across pages; `src/components/ui/` contains reusable UI primitives.
- `src/lib/` contains shared clients and utilities.

Keep page implementations in `src/components/pages/<page-name>/` and have the matching `src/app/` `page.tsx` import them. Group API route handlers by feature under `src/app/api/dashboard/<feature>/`; keep CRUD methods for a resource in its `route.ts` and nest related resources, such as customer tags under `customers/tags` and campaign recipients under `campaigns/recipients`.

## Send Message Audience Imports

On the Send Message page, choose a campaign and import a `.csv` or `.xlsx` file with `Name`/`full_name` and `Phone`/`phone_e164` columns (email is optional). Valid numbers replace that campaign's audience; customers are matched by phone so existing contacts are reused instead of duplicated. This prepares the recipient list only—WhatsApp message delivery is not integrated yet.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
