// https://github.com/mongodb-developer/nextjs-with-mongodb/blob/main/lib/mongodb.ts
import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const options = {};

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
}

await client.connect();

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client;