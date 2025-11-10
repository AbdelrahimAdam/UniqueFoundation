// createAdminDoc.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3uGr4F17VK-6OY_dyGSSclVuf_QyuSQc",
  authDomain: "uniquefoundation-org.firebaseapp.com",
  projectId: "uniquefoundation-org",
  storageBucket: "uniquefoundation-org.firebasestorage.app",
  messagingSenderId: "1021315264601",
  appId: "1:1021315264601:web:7954fffae51c3d1cc48148"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const createAdminDocument = async () => {
  try {
    console.log("🚀 Setting up admin Firestore document...");
    
    // First, sign in to get the user UID
    console.log("Signing in to get user info...");
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "admin@meetrecorder.com",
      "AdminPassword123!"
    );
    
    const user = userCredential.user;
    console.log("✅ Signed in successfully. User UID:", user.uid);

    // Check if document already exists
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      console.log("⚠️  Admin document already exists in Firestore:");
      console.log("Data:", userDoc.data());
      return { success: true, exists: true };
    }

    // Create admin user document
    const adminData = {
      uid: user.uid,
      email: "admin@meetrecorder.com",
      firstName: "Admin",
      lastName: "User",
      displayName: "Admin User",
      role: "admin",
      isActive: true,
      isAdmin: true, // Add this for your current rules
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating Firestore document...");
    await setDoc(doc(db, "users", user.uid), adminData);
    
    // Verify the document was created
    const newDoc = await getDoc(doc(db, "users", user.uid));
    if (newDoc.exists()) {
      console.log("\n🎉 ADMIN DOCUMENT CREATED SUCCESSFULLY!");
      console.log("=======================================");
      console.log("📧 Email: admin@meetrecorder.com");
      console.log("👤 UID:", user.uid);
      console.log("🎯 Role: admin");
      console.log("🔓 Full system access granted");
      console.log("=======================================\n");
    } else {
      throw new Error("Failed to create document");
    }

    return { success: true, exists: false };

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    
    if (error.code === 'auth/wrong-password') {
      console.log("ℹ️  Wrong password. You can:");
      console.log("   1. Reset password in Firebase Console");
      console.log("   2. Or create a new admin with different email");
    } else if (error.code === 'auth/user-not-found') {
      console.log("ℹ️  User not found. The auth user might have been deleted.");
    } else if (error.code === 'permission-denied') {
      console.log("ℹ️  Firestore rules are blocking writes.");
      console.log("   Please use temporary rules as shown in previous message.");
    }
    
    return { success: false, error: error.message };
  }
};

// Run the function
createAdminDocument()
  .then(result => {
    if (result.success) {
      console.log("✅ Script completed successfully!");
      process.exit(0);
    } else {
      console.log("❌ Script failed");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });