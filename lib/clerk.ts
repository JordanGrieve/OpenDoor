// Clerk is optional — customer accounts light up only when a publishable
// key is present. Everything else (guest checkout) works without it.
// NEXT_PUBLIC_* is inlined at build so this is readable on client + server.
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
