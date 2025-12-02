
import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

declare global {
    var mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}
/** 
 * Cached connection for MongoDB.
 */
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
let cached: MongooseCache = global.mongoose as MongooseCache;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {


    if (cached!.conn) {
        return cached!.conn;
    }
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI!, {
            dbName: 'appointment_saas',
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}



export default dbConnect;