require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if superadmin already exists
        const existingSuperAdmin = await User.findOne({ username: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('Superadmin user already exists!');
            console.log('Username: superadmin');
            process.exit(0);
        }

        // Create superadmin user
        const superadmin = new User({
            name: 'Super Administrator',
            username: 'superadmin',
            password: 'superadmin123',
            role: 'superadmin',
            status: true,
            phoneNumber: '+1234567890',
            address: 'Main Office',
            branches: [],
            notes: 'Super administrator account - can manage branches'
        });

        await superadmin.save();
        console.log('\n✅ Superadmin user created successfully!');
        console.log('==========================================');
        console.log('Username: superadmin');
        console.log('Password: superadmin123');
        console.log('==========================================');
        console.log('\nYou can now login at: http://localhost:3000/login');
        console.log('\nIMPORTANT: Change the password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating superadmin:', error.message);
        process.exit(1);
    }
}

createSuperAdmin();
