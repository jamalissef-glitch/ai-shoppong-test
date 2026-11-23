
import mongoose from "mongoose";

const envMongoUri = process.env.MONGODB_URI;

if (!envMongoUri) {
  throw new Error(
    "Please define MONGODB_URI in .env.local"
  );
}

// Explicitly narrow the environment variable to string.
const MONGODB_URI: string = envMongoUri;

const cached = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const mongooseCache = cached.mongoose ?? {
  conn: null,
  promise: null,
};

cached.mongoose = mongooseCache;

export async function connectDB() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise =
      mongoose.connect(MONGODB_URI);
  }

  try {
    mongooseCache.conn =
      await mongooseCache.promise;

    return mongooseCache.conn;
  } catch (error) {
    mongooseCache.promise = null;
    throw error;
  }
}
