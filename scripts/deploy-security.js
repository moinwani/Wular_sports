#!/usr/bin/env node

/**
 * Firebase Security Deployment Script
 * Automates the deployment of Firestore security rules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, silent = false) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        if (!silent) console.log(output);
        return output;
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

async function main() {
    console.log('\n🔐 Firebase Security Deployment Wizard\n');
    console.log('This will deploy your Firestore security rules.\n');

    // Step 1: Check Firebase CLI
    console.log('📋 Step 1: Checking Firebase CLI...');
    try {
        const version = exec('firebase --version', true);
        console.log(`✅ Firebase CLI installed: ${version.trim()}`);
    } catch {
        console.log('❌ Firebase CLI not installed');
        console.log('\nInstall with: npm install -g firebase-tools\n');
        process.exit(1);
    }

    // Step 2: Check if logged in
    console.log('\n📋 Step 2: Checking Firebase login...');
    try {
        exec('firebase projects:list', true);
        console.log('✅ Already logged in to Firebase');
    } catch {
        console.log('⚠️  Not logged in. Opening browser for authentication...');
        exec('firebase login');
    }

    // Step 3: Get project ID
    console.log('\n📋 Step 3: Configure Firebase project...');

    let projectId;
    try {
        const config = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
        projectId = config.projects.default;

        if (projectId === 'your-firebase-project-id') {
            throw new Error('Project ID not configured');
        }

        console.log(`Found project ID: ${projectId}`);
        const confirm = await question(`Use this project? (yes/no): `);

        if (confirm.toLowerCase() !== 'yes') {
            projectId = await question('Enter your Firebase project ID: ');
        }
    } catch {
        projectId = await question('Enter your Firebase project ID: ');
    }

    // Update .firebaserc
    const firebaserc = {
        projects: {
            default: projectId
        }
    };
    fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2));
    console.log(`✅ Updated .firebaserc with project: ${projectId}`);

    // Step 4: Deploy rules
    console.log('\n📋 Step 4: Deploying Firestore security rules...');
    console.log('⚠️  This will replace existing rules (if any)');

    const deploy = await question('Deploy now? (yes/no): ');

    if (deploy.toLowerCase() !== 'yes') {
        console.log('\n❌ Deployment cancelled');
        rl.close();
        process.exit(0);
    }

    try {
        console.log('\n🚀 Deploying...');
        exec('firebase deploy --only firestore:rules');
        console.log('\n✅ Firestore rules deployed successfully!');
    } catch (error) {
        console.log('\n❌ Deployment failed');
        rl.close();
        process.exit(1);
    }

    // Step 5: Verify
    console.log('\n📋 Step 5: Verifying deployment...');
    console.log('\nCheck Firebase Console:');
    console.log(`https://console.firebase.google.com/project/${projectId}/firestore/rules`);
    console.log('\nYou should see 225 lines of security rules.\n');

    // Next steps
    console.log('━'.repeat(50));
    console.log('\n✅ DEPLOYMENT COMPLETE!\n');
    console.log('📋 Next Steps:\n');
    console.log('1. Set up admin access:');
    console.log('   npm install firebase-admin');
    console.log('   node scripts/admin-setup.js your@email.com\n');
    console.log('2. Enable Firebase Auth in Console:');
    console.log(`   https://console.firebase.google.com/project/${projectId}/authentication\n`);
    console.log('3. Update frontend code (see docs/DEPLOYMENT_GUIDE.md)\n');
    console.log('4. Test security:');
    console.log('   node scripts/attack-simulation.js\n');

    rl.close();
}

main().catch(error => {
    console.error('\n❌ Script error:', error);
    process.exit(1);
});
