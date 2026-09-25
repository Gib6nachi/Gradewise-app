import { Account, Client, Databases, ID } from "react-native-appwrite";
import "react-native-url-polyfill/auto"; // Critical mobile support module layer

// Automatically references the secure key values we just locked inside your .env file
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
};

// Initialize the central Appwrite cloud service handshake platform engine client
const client = new Client();

client.setEndpoint(config.endpoint).setProject(config.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID };

