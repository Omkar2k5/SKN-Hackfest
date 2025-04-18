package com.example.smartfianacetracker.activities;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.checkbox.MaterialCheckBox;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.example.smartfianacetracker.R;
import com.example.smartfianacetracker.utils.FirebaseManager;

public class LoginActivity extends AppCompatActivity {
    private static final String TAG = "LoginActivity";
    private TextInputLayout emailLayout, passwordLayout;
    private TextInputEditText emailInput, passwordInput;
    private MaterialButton loginButton, googleButton;
    private MaterialCheckBox rememberMeCheckbox;
    private CircularProgressIndicator progressIndicator;
    private FirebaseManager firebaseManager;
    private ActivityResultLauncher<Intent> googleSignInLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        initializeViews();
        setupFirebase();
        setupGoogleSignIn();
        checkExistingSession();
    }

    private void initializeViews() {
        emailLayout = findViewById(R.id.emailLayout);
        passwordLayout = findViewById(R.id.passwordLayout);
        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        loginButton = findViewById(R.id.loginButton);
        googleButton = findViewById(R.id.googleButton);
        rememberMeCheckbox = findViewById(R.id.rememberMeCheckbox);
        progressIndicator = findViewById(R.id.progressIndicator);

        loginButton.setOnClickListener(v -> handleEmailLogin());
        googleButton.setOnClickListener(v -> handleGoogleLogin());
        findViewById(R.id.signupText).setOnClickListener(v -> 
            startActivity(new Intent(this, SignupActivity.class)));
    }

    private void setupFirebase() {
        firebaseManager = FirebaseManager.getInstance(this);
    }

    private void setupGoogleSignIn() {
        googleSignInLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                handleGoogleSignInResult(task);
            }
        );
    }

    private void checkExistingSession() {
        if (firebaseManager.isLoggedIn()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
        }
    }

    private void handleEmailLogin() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        if (!validateInput(email, password)) {
            return;
        }

        setLoading(true);
        firebaseManager.signInWithEmail(email, password)
            .addOnCompleteListener(task -> {
                setLoading(false);
                if (task.isSuccessful()) {
                    startActivity(new Intent(this, MainActivity.class));
                    finish();
                } else {
                    showError(task.getException() != null ? 
                        task.getException().getMessage() : 
                        "Login failed");
                }
            });
    }

    private void handleGoogleLogin() {
        setLoading(true);
        Intent signInIntent = firebaseManager.getGoogleSignInClient().getSignInIntent();
        googleSignInLauncher.launch(signInIntent);
    }

    private void handleGoogleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            Log.d(TAG, "Google Sign In successful, account email: " + account.getEmail());
            
            setLoading(true);
            firebaseManager.signInWithGoogle(account)
                .addOnCompleteListener(task -> {
                    setLoading(false);
                    if (task.isSuccessful()) {
                        Log.d(TAG, "Firebase authentication successful");
                        startActivity(new Intent(this, MainActivity.class));
                        finish();
                    } else {
                        String errorMessage = "Google sign in failed";
                        if (task.getException() != null) {
                            Log.e(TAG, "Firebase authentication failed", task.getException());
                            errorMessage = task.getException().getMessage();
                        }
                        showError(errorMessage);
                    }
                });
        } catch (ApiException e) {
            setLoading(false);
            Log.e(TAG, "Google sign in failed", e);
            String errorMessage;
            switch (e.getStatusCode()) {
                case 12500: // SIGN_IN_FAILED
                    errorMessage = "Google Play Services update required";
                    break;
                case 7: // NETWORK_ERROR
                    errorMessage = "Network error, please check your connection";
                    break;
                case 5: // SIGN_IN_CANCELLED
                    errorMessage = "Sign in cancelled";
                    break;
                case 13: // SIGN_IN_REQUIRED
                    errorMessage = "Please sign in with your Google account";
                    break;
                case 8: // INTERNAL_ERROR
                    errorMessage = "Internal error occurred, please try again";
                    break;
                case 10: // DEVELOPER_ERROR
                    errorMessage = "Google Sign In configuration error";
                    Log.e(TAG, "Developer error: Check if the SHA-1 fingerprint is configured in Firebase Console");
                    break;
                default:
                    errorMessage = "Google sign in failed: " + e.getStatusCode();
            }
            showError(errorMessage);
        }
    }

    private boolean validateInput(String email, String password) {
        boolean isValid = true;

        if (email.isEmpty()) {
            emailLayout.setError("Email is required");
            isValid = false;
        } else {
            emailLayout.setError(null);
        }

        if (password.isEmpty()) {
            passwordLayout.setError("Password is required");
            isValid = false;
        } else {
            passwordLayout.setError(null);
        }

        return isValid;
    }

    private void setLoading(boolean isLoading) {
        progressIndicator.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        loginButton.setEnabled(!isLoading);
        googleButton.setEnabled(!isLoading);
        emailInput.setEnabled(!isLoading);
        passwordInput.setEnabled(!isLoading);
    }

    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
} 