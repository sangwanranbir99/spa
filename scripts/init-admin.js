require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Username: admin');
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            name: 'System Administrator',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            status: true,
            phoneNumber: '+1234567890',
            address: 'Main Office',
            branches: [],
            notes: 'System administrator account'
        });

        await admin.save();
        console.log('\n✅ Admin user created successfully!');
        console.log('==========================================');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('==========================================');
        console.log('\nYou can now login at: http://localhost:3000/login');
        console.log('\nIMPORTANT: Change the password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
