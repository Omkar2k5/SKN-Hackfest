package com.example.smartfianacetracker.utils;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.example.smartfianacetracker.R;
import java.util.HashMap;
import java.util.Map;

public class FirebaseManager {
    private static final String TAG = "FirebaseManager";
    private final FirebaseAuth firebaseAuth;
    private final DatabaseReference databaseReference;
    private final PreferenceManager preferenceManager;
    private final GoogleSignInClient googleSignInClient;
    private static FirebaseManager instance;

    private FirebaseManager(Context context) {
        firebaseAuth = FirebaseAuth.getInstance();
        databaseReference = FirebaseDatabase.getInstance().getReference();
        preferenceManager = new PreferenceManager(context);

        // Configure Google Sign In with web client ID
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken("687898768842-016uetfn4soao9j866tbn1hg50d2dr1k.apps.googleusercontent.com")
                .requestEmail()
                .build();
        googleSignInClient = GoogleSignIn.getClient(context, gso);
    }

    public static synchronized FirebaseManager getInstance(Context context) {
        if (instance == null) {
            instance = new FirebaseManager(context.getApplicationContext());
        }
        return instance;
    }

    public Task<Void> createUserWithEmail(String email, String password) {
        return firebaseAuth.createUserWithEmailAndPassword(email, password)
                .continueWithTask(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        FirebaseUser user = task.getResult().getUser();
                        return initializeUserData(user);
                    }
                    throw task.getException();
                })
                .continueWithTask(task -> {
                    if (task.isSuccessful() && firebaseAuth.getCurrentUser() != null) {
                        return firebaseAuth.getCurrentUser().getIdToken(true);
                    }
                    throw task.getException();
                })
                .continueWith(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        String token = task.getResult().getToken();
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        preferenceManager.saveUserSession(
                            user.getUid(),
                            user.getEmail(),
                            token
                        );
                    }
                    return null;
                });
    }

    public Task<Void> signInWithEmail(String email, String password) {
        return firebaseAuth.signInWithEmailAndPassword(email, password)
                .continueWithTask(task -> {
                    if (task.isSuccessful() && firebaseAuth.getCurrentUser() != null) {
                        return firebaseAuth.getCurrentUser().getIdToken(true);
                    }
                    throw task.getException();
                })
                .continueWith(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        String token = task.getResult().getToken();
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        preferenceManager.saveUserSession(
                            user.getUid(),
                            user.getEmail(),
                            token
                        );
                    }
                    return null;
                });
    }

    public Task<Void> signInWithGoogle(GoogleSignInAccount account) {
        Log.d(TAG, "signInWithGoogle: starting Google sign in process");
        if (account == null) {
            Log.e(TAG, "signInWithGoogle: account is null");
            return Tasks.forException(new Exception("Google Sign In failed: account is null"));
        }

        AuthCredential credential = GoogleAuthProvider.getCredential(account.getIdToken(), null);
        return firebaseAuth.signInWithCredential(credential)
                .continueWithTask(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        FirebaseUser user = task.getResult().getUser();
                        Log.d(TAG, "signInWithGoogle: Firebase auth successful");
                        return checkAndInitializeUserData(user);
                    }
                    Log.e(TAG, "signInWithGoogle: Firebase auth failed", task.getException());
                    throw task.getException();
                })
                .continueWithTask(task -> {
                    if (task.isSuccessful() && firebaseAuth.getCurrentUser() != null) {
                        Log.d(TAG, "signInWithGoogle: Getting ID token");
                        return firebaseAuth.getCurrentUser().getIdToken(true);
                    }
                    Log.e(TAG, "signInWithGoogle: User data initialization failed", task.getException());
                    throw task.getException();
                })
                .continueWith(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        String token = task.getResult().getToken();
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        Log.d(TAG, "signInWithGoogle: Saving user session");
                        preferenceManager.saveUserSession(
                            user.getUid(),
                            user.getEmail(),
                            token
                        );
                    } else {
                        Log.e(TAG, "signInWithGoogle: Token retrieval failed", task.getException());
                    }
                    return null;
                });
    }

    private Task<Void> checkAndInitializeUserData(FirebaseUser user) {
        Log.d(TAG, "checkAndInitializeUserData: Checking user data");
        return databaseReference.child("users").child(user.getUid())
                .get()
                .continueWithTask(task -> {
                    if (task.isSuccessful()) {
                        DataSnapshot snapshot = task.getResult();
                        if (!snapshot.exists()) {
                            Log.d(TAG, "checkAndInitializeUserData: Initializing new user data");
                            return initializeUserData(user);
                        }
                        Log.d(TAG, "checkAndInitializeUserData: User data already exists");
                    } else {
                        Log.e(TAG, "checkAndInitializeUserData: Failed to check user data", task.getException());
                    }
                    return Tasks.forResult(null);
                });
    }

    private Task<Void> initializeUserData(FirebaseUser user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("email", user.getEmail());
        userData.put("displayName", user.getDisplayName());
        userData.put("photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : null);
        userData.put("createdAt", System.currentTimeMillis());
        userData.put("lastLogin", System.currentTimeMillis());
        userData.put("budgets", new HashMap<>());
        userData.put("credit", new HashMap<>());
        userData.put("debit", new HashMap<>());
        userData.put("service_status", "initialized_" + System.currentTimeMillis());
        
        Map<String, String> transactions = new HashMap<>();
        transactions.put("test", "connection_test");
        userData.put("transactions", transactions);

        Log.d(TAG, "initializeUserData: Creating new user data");
        return databaseReference.child("users").child(user.getUid())
                .setValue(userData)
                .addOnFailureListener(e -> Log.e(TAG, "initializeUserData: Failed to initialize user data", e));
    }

    public Task<Void> signOut() {
        return googleSignInClient.signOut()
                .continueWith(task -> {
                    firebaseAuth.signOut();
                    preferenceManager.clearSession();
                    return null;
                });
    }

    public FirebaseUser getCurrentUser() {
        return firebaseAuth.getCurrentUser();
    }

    public GoogleSignInClient getGoogleSignInClient() {
        return googleSignInClient;
    }

    public boolean isLoggedIn() {
        return preferenceManager.isLoggedIn() && getCurrentUser() != null;
    }
} 