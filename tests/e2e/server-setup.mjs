import { startServer } from '../../scripts/serve.mjs';

// The runner owns this server directly. No shell process, shared service or
// platform-specific process-tree termination is needed during teardown.
export default async function setup() {
  const server = await startServer(4179);
  return async () => {
    server.closeAllConnections();
    await new Promise((ok, fail) => server.close(error => error ? fail(error) : ok()));
  };
}
