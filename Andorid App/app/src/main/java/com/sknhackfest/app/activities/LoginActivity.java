package com.sknhackfest.app.activities;

import android.content.Intent;
import android.os.Bundle;
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
import com.sknhackfest.app.R;
import com.sknhackfest.app.utils.FirebaseManager;

public class LoginActivity extends AppCompatActivity {
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
            firebaseManager.signInWithGoogle(account)
                .addOnCompleteListener(task -> {
                    setLoading(false);
                    if (task.isSuccessful()) {
                        startActivity(new Intent(this, MainActivity.class));
                        finish();
                    } else {
                        showError(task.getException() != null ? 
                            task.getException().getMessage() : 
                            "Google sign in failed");
                    }
                });
        } catch (ApiException e) {
            setLoading(false);
            showError("Google sign in failed: " + e.getStatusCode());
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