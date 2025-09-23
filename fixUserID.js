// Fix User ID Script - Run this in the browser console after logging in

(async function fixUserID() {
    console.log('🔧 Starting User ID Fix...\n');

    // The correct database ID for daniel.vadacchino+1@hotmail.com
    const CORRECT_USER_ID = 'user-9237df03-ebea-4bbd-95c4-95041fc5ec35';
    const USER_EMAIL = 'daniel.vadacchino+1@hotmail.com';

    // Step 1: Get current user
    const currentUser = JSON.parse(localStorage.getItem('freight_shark_current_user') || 'null');

    if (!currentUser) {
        console.error('❌ No user logged in! Please login first.');
        return;
    }

    console.log('Current User ID:', currentUser.id);
    console.log('Current Email:', currentUser.email);

    if (currentUser.email.toLowerCase() !== USER_EMAIL.toLowerCase()) {
        console.error('❌ This script is for daniel.vadacchino+1@hotmail.com only');
        return;
    }

    // Step 2: Update current user with correct ID
    const updatedCurrentUser = {
        ...currentUser,
        id: CORRECT_USER_ID
    };

    localStorage.setItem('freight_shark_current_user', JSON.stringify(updatedCurrentUser));
    console.log('✅ Updated current user ID to:', CORRECT_USER_ID);

    // Step 3: Update users array
    let users = JSON.parse(localStorage.getItem('freight_shark_users') || '[]');

    // Remove any incorrect entries for this email
    users = users.filter(u => u.email.toLowerCase() !== USER_EMAIL.toLowerCase());

    // Add the correct user entry
    users.push({
        ...updatedCurrentUser,
        id: CORRECT_USER_ID,
        email: USER_EMAIL,
        passwordHash: currentUser.passwordHash || 'temp_hash'
    });

    localStorage.setItem('freight_shark_users', JSON.stringify(users));
    console.log('✅ Updated users list with correct ID');

    // Step 4: Update auth token
    const authToken = localStorage.getItem('freight_shark_auth_token');
    if (authToken) {
        try {
            const tokenData = JSON.parse(atob(authToken));
            tokenData.userId = CORRECT_USER_ID;
            const newToken = btoa(JSON.stringify(tokenData));
            localStorage.setItem('freight_shark_auth_token', newToken);
            localStorage.setItem('authToken', newToken);
            console.log('✅ Updated auth token with correct ID');
        } catch (e) {
            console.warn('⚠️ Could not update auth token, you may need to re-login');
        }
    }

    // Step 5: Clear any problematic data
    localStorage.removeItem('sampleSequence'); // Reset sample counter

    console.log('\n🎉 User ID fix complete!');
    console.log('Your user ID is now:', CORRECT_USER_ID);
    console.log('\n📝 Next steps:');
    console.log('1. Refresh the page');
    console.log('2. Try creating a sample consolidation request');
    console.log('3. It should work without errors now!');

    // Optional: Auto-refresh after 2 seconds
    setTimeout(() => {
        if (confirm('User ID fixed! Refresh the page now?')) {
            location.reload();
        }
    }, 1000);
})();