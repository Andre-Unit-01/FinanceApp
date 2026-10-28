/*
 * Server process entry point.
 *
 * app.js defines the Express application. This file is responsible only for
 * opening the port and disconnecting the shared Prisma client during shutdown.
 */
import app from './app.js';
import prisma from './lib/prisma.js';

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  // Closing the shared database client gives PostgreSQL a clean disconnect
  // when the developer stops the server with Ctrl+C.
  await prisma.$disconnect();
  process.exit(0);
});
