package com.example.smartfianacetracker;

import android.app.Application;
import com.google.firebase.FirebaseApp;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;

public class SmartFinanceApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Initialize Firebase
        FirebaseApp.initializeApp(this);
        
        // Initialize Google Sign In with web client ID
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken("687898768842-016uetfn4soao9j866tbn1hg50d2dr1k.apps.googleusercontent.com")
                .requestEmail()
                .build();
    }
} 