import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('No URI found');
    process.exit(1);
}

// Append authSource=admin if not present
if (!uri.includes('authSource')) {
    uri += '&authSource=admin';
}

console.log('Testing URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Mask password

mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Connection failed:', err.message);
        process.exit(1);
    });
