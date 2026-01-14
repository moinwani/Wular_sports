const admin = require('firebase-admin');
const readline = require('readline');

/**
 * Admin Custom Claims Setup Script
 * 
 * Purpose: Set admin custom claim on a user to grant full access to Firestore data
 * Usage: node scripts/admin-setup.js [email]
 * 
 * IMPORTANT: This script requires Firebase Admin SDK credentials
 * Download service account key from Firebase Console > Project Settings > Service Accounts
 * Save as ./serviceAccountKey.json
 */

// Initialize Firebase Admin
try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:');
    console.error('   Make sure serviceAccountKey.json exists in project root');
    console.error('   Download from: Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setAdminClaim(email) {
    try {
        // Get user by email
        console.log(`\nLooking up user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);

        console.log(`✅ User found: ${user.uid}`);
        console.log(`   Display Name: ${user.displayName || '(not set)'}`);
        console.log(`   Email Verified: ${user.emailVerified}`);

        // Check current claims
        const currentClaims = user.customClaims || {};
        console.log(`\n   Current Custom Claims:`, currentClaims);

        if (currentClaims.admin) {
            console.log('\n⚠️  User already has admin claim');

            return new Promise((resolve) => {
                rl.question('Do you want to remove admin access? (yes/no): ', async (answer) => {
                    if (answer.toLowerCase() === 'yes') {
                        await admin.auth().setCustomUserClaims(user.uid, { admin: false });
                        console.log('✅ Admin claim removed');
                        console.log('\n⚠️  User must sign out and sign in again for changes to take effect');
                    } else {
                        console.log('No changes made');
                    }
                    resolve();
                });
            });
        }

        // Set admin claim
        console.log('\n🔐 Setting admin custom claim...');
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log('✅ Admin claim set successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. User must sign out and sign in again');
        console.log('   2. Admin access will be granted after re-authentication');
        console.log('   3. Verify by checking request.auth.token.admin in Firestore rules');

        // Verify the claim was set
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log('\n✅ Verification:', updatedUser.customClaims);

    } catch (error) {
        console.error('\n❌ Error setting admin claim:', error.message);

        if (error.code === 'auth/user-not-found') {
            console.error('   User not found. Make sure:');
            console.error('   1. Email is correct');
            console.error('   2. User has signed up in your app');
            console.error('   3. You are connected to the correct Firebase project');
        }

        process.exit(1);
    }
}

async function listAllUsers() {
    try {
        console.log('\n📋 All users in this Firebase project:\n');
        const listUsersResult = await admin.auth().listUsers(100);

        if (listUsersResult.users.length === 0) {
            console.log('   No users found. Create a user first.');
            return;
        }

        listUsersResult.users.forEach((user) => {
            const isAdmin = user.customClaims?.admin ? '👑 ADMIN' : '';
            console.log(`   ${user.email || user.uid} ${isAdmin}`);
            console.log(`   UID: ${user.uid}`);
            if (user.customClaims) {
                console.log(`   Claims:`, user.customClaims);
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error listing users:', error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args[0] === '--list') {
        await listAllUsers();
        rl.close();
        process.exit(0);
    }

    const email = args[0];

    if (!email) {
        console.log('\n🔐 Firebase Admin Setup Script\n');
        console.log('Usage:');
        console.log('  node scripts/admin-setup.js <email>      - Set admin claim on user');
        console.log('  node scripts/admin-setup.js --list       - List all users\n');
        console.log('Example:');
        console.log('  node scripts/admin-setup.js admin@wularsports.com\n');

        rl.question('Enter email address to make admin: ', async (answer) => {
            if (answer.trim()) {
                await setAdminClaim(answer.trim());
            }
            rl.close();
            process.exit(0);
        });
    } else {
        await setAdminClaim(email);
        rl.close();
        process.exit(0);
    }
}

main();
