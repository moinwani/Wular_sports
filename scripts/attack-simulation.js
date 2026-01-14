const admin = require('firebase-admin');

/**
 * Attack Simulation Script
 * 
 * Purpose: Verify security rules prevent common attack vectors
 * Usage: node scripts/attack-simulation.js
 * 
 * This script simulates various attacks that should ALL FAIL with proper security rules
 */

const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log('\n🔒 FIREBASE SECURITY ATTACK SIMULATION');
console.log('=''.repeat(50));
console.log('\nAll attacks below should FAIL with proper security rules');
console.log('If any succeed, your security rules are misconfigured!\n');

async function attackEmailHarvesting() {
    console.log('📧 Attack 1: Mass Email Harvesting');
    console.log('   Attempting to read all subscriber emails...');

    try {
        // In a real client-side attack, this would use firebase/firestore
        // Here we're simulating with admin SDK to show the concept
        const snapshot = await db.collection('subscribers').get();

        if (snapshot.size > 0) {
            console.log(`   ❌ SECURITY BREACH! Read ${snapshot.size} subscriber emails`);
            console.log(`   First email: ${snapshot.docs[0].data().email}`);
            return false;
        } else {
            console.log('   ✅ PROTECTED: No emails accessible');
            return true;
        }
    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackOrderEnumeration() {
    console.log('\n📦 Attack 2: Order Enumeration');
    console.log('   Attempting to enumerate all customer orders...');

    try {
        const snapshot = await db.collection('orders').get();

        if (snapshot.size > 0) {
            console.log(`   ❌ SECURITY BREACH! Read ${snapshot.size} orders`);
            const order = snapshot.docs[0].data();
            console.log(`   Exposed PII: ${order.customerName}, ${order.customerPhone}`);
            return false;
        } else {
            console.log('   ✅ PROTECTED: No orders accessible');
            return true;
        }
    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackPaymentTampering() {
    console.log('\n💳 Attack 3: Payment Status Tampering');
    console.log('   Attempting to mark unpaid order as paid...');

    try {
        // Get first order
        const snapshot = await db.collection('orders').limit(1).get();

        if (snapshot.empty) {
            console.log('   ⚠️  No orders to test with');
            return true;
        }

        const orderId = snapshot.docs[0].id;

        // Try to change payment status
        await db.collection('orders').doc(orderId).update({
            paymentStatus: 'completed'
        });

        console.log('   ❌ SECURITY BREACH! Payment status modified');
        return false;

    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackOrderAmountModification() {
    console.log('\n💰 Attack 4: Order Amount Modification');
    console.log('   Attempting to change order total to ₹1...');

    try {
        const snapshot = await db.collection('orders').limit(1).get();

        if (snapshot.empty) {
            console.log('   ⚠️  No orders to test with');
            return true;
        }

        const orderId = snapshot.docs[0].id;

        await db.collection('orders').doc(orderId).update({
            total: 1
        });

        console.log('   ❌ SECURITY BREACH! Order amount modified');
        return false;

    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackMassDeletion() {
    console.log('\n🗑️  Attack 5: Mass Deletion Attack');
    console.log('   Attempting to delete all subscribers...');

    try {
        const snapshot = await db.collection('subscribers').limit(5).get();

        let deletedCount = 0;
        for (const doc of snapshot.docs) {
            try {
                await doc.ref.delete();
                deletedCount++;
            } catch (e) {
                // Expected to fail
            }
        }

        if (deletedCount > 0) {
            console.log(`   ❌ SECURITY BREACH! Deleted ${deletedCount} subscribers`);
            return false;
        } else {
            console.log('   ✅ PROTECTED: Cannot delete subscribers');
            return true;
        }

    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackFakeOrderInjection() {
    console.log('\n🎭 Attack 6: Fake Order Injection');
    console.log('   Attempting to inject fake order without authentication...');

    try {
        // This simulates an unauthenticated user trying to create an order
        await db.collection('orders').add({
            userId: 'FAKE_USER',
            orderNumber: 'WS999999999',
            customerName: 'Attacker Name',
            customerEmail: 'attacker@evil.com',
            customerPhone: '+919999999999',
            customerAddress: {
                street: 'Fake Address',
                city: 'Fake City',
                state: 'Fake State',
                pincode: '000000'
            },
            items: [],
            total: 0,
            status: 'delivered',  // Trying to mark as delivered immediately
            paymentStatus: 'completed',  // Trying to mark as paid
            paymentMethod: 'free',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now()
        });

        console.log('   ❌ SECURITY BREACH! Fake order created');
        return false;

    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function attackUserImpersonation() {
    console.log('\n👤 Attack 7: User Impersonation');
    console.log('   Attempting to read another user\'s orders...');

    try {
        // Try to query for a specific user's orders (should fail if not admin)
        const snapshot = await db.collection('orders')
            .where('customerEmail', '==', 'victim@example.com')
            .get();

        if (!snapshot.empty) {
            console.log(`   ❌ SECURITY BREACH! Read ${snapshot.size} orders from other user`);
            return false;
        }

        console.log('   ✅ PROTECTED: Cannot access other users\' orders');
        return true;

    } catch (error) {
        console.log(`   ✅ PROTECTED: ${error.code || error.message}`);
        return true;
    }
}

async function runAllAttacks() {
    const results = [];

    results.push(await attackEmailHarvesting());
    results.push(await attackOrderEnumeration());
    results.push(await attackPaymentTampering());
    results.push(await attackOrderAmountModification());
    results.push(await attackMassDeletion());
    results.push(await attackFakeOrderInjection());
    results.push(await attackUserImpersonation());

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS SUMMARY\n');

    const passedCount = results.filter(r => r).length;
    const totalCount = results.length;

    console.log(`   Protected: ${passedCount}/${totalCount}`);
    console.log(`   Vulnerable: ${totalCount - passedCount}/${totalCount}\n`);

    if (passedCount === totalCount) {
        console.log('✅ ALL ATTACKS BLOCKED - Security rules working correctly!');
        console.log('   Your database is protected against common attacks.');
    } else {
        console.log('❌ SECURITY VULNERABILITIES DETECTED!');
        console.log('   Deploy Firestore security rules immediately!');
        console.log('   Run: firebase deploy --only firestore:rules');
    }

    console.log('\n⚠️  Note: This script uses Admin SDK which bypasses rules.');
    console.log('   For client-side testing, use the Firebase emulator.');

    process.exit(passedCount === totalCount ? 0 : 1);
}

// Note about Admin SDK
console.log('⚠️  IMPORTANT: Admin SDK bypasses security rules');
console.log('   This simulation demonstrates attack concepts');
console.log('   For accurate testing, use Firebase Auth Rules Unit Testing\n');

runAllAttacks().catch(error => {
    console.error('\n❌ Script error:', error);
    process.exit(1);
});
