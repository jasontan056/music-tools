import { createServer } from './app';
import { serverConfig } from './env';

const app = createServer();

app.listen(serverConfig.port, () => {
  console.log(`Server ready on http://localhost:${serverConfig.port}`);
});
