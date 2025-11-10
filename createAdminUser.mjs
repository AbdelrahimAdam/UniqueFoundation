// src/createAdminUser.jsx
import { auth, db } from "./src/config/firebase.jsx";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

const createAdminUser = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@meetrecorder.com",
      "AdminPassword123!"
    );

    await updateProfile(userCredential.user, {
      displayName: "Admin User",
    });

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: "admin@meetrecorder.com",
      firstName: "Admin",
      lastName: "User",
      displayName: "Admin User",
      role: "admin",
      isActive: true,
      subscription: {
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

// Call the function once
createAdminUser();
