import { createServer } from './app.js';
import { serverConfig } from './env.js';

const app = createServer();

app.listen(serverConfig.port, () => {
  console.log(`Server ready on http://localhost:${serverConfig.port}`);
});
