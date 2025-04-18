package com.sknhackfest.app.utils;

import android.content.Context;
import androidx.annotation.NonNull;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.HashMap;
import java.util.Map;

public class FirebaseManager {
    private final FirebaseAuth firebaseAuth;
    private final DatabaseReference databaseReference;
    private final PreferenceManager preferenceManager;
    private final GoogleSignInClient googleSignInClient;
    private static FirebaseManager instance;

    private FirebaseManager(Context context) {
        firebaseAuth = FirebaseAuth.getInstance();
        databaseReference = FirebaseDatabase.getInstance().getReference();
        preferenceManager = new PreferenceManager(context);

        // Configure Google Sign In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(context.getString(R.string.default_web_client_id))
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
        AuthCredential credential = GoogleAuthProvider.getCredential(account.getIdToken(), null);
        return firebaseAuth.signInWithCredential(credential)
                .continueWithTask(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        FirebaseUser user = task.getResult().getUser();
                        return checkAndInitializeUserData(user);
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

    private Task<Void> checkAndInitializeUserData(FirebaseUser user) {
        return databaseReference.child("users").child(user.getUid())
                .get()
                .continueWithTask(task -> {
                    if (task.isSuccessful()) {
                        DataSnapshot snapshot = task.getResult();
                        if (!snapshot.exists()) {
                            return initializeUserData(user);
                        }
                    }
                    return Task.forResult(null);
                });
    }

    private Task<Void> initializeUserData(FirebaseUser user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("budgets", new HashMap<>());
        userData.put("credit", new HashMap<>());
        userData.put("debit", new HashMap<>());
        userData.put("service_status", "initialized_" + System.currentTimeMillis());
        Map<String, String> transactions = new HashMap<>();
        transactions.put("test", "connection_test");
        userData.put("transactions", transactions);

        return databaseReference.child("users").child(user.getUid())
                .setValue(userData);
    }

    public Task<Void> signOut() {
        return firebaseAuth.signOut()
                .continueWith(task -> {
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