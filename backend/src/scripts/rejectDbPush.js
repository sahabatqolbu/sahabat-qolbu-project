console.error("db:push is disabled for this project.");
console.error("Production schema changes must use reviewed migration files and npm run db:migrate.");
console.error("For disposable local development only, use npm run db:push:dev intentionally.");
process.exit(1);
