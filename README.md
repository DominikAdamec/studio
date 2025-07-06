# Firebase Studio Project

## ⚠️ App Check Setup Required

This project uses Firebase App Check to protect your backend resources. You need to provide your reCAPTCHA v3 Site Key for it to work.

1.  **Get reCAPTCHA Key**: In the Firebase Console, go to **App Check**, enable it for your web app with **reCAPTCHA v3**, and get the **Site Key**.
2.  **Update `.env` file**: Copy the Site Key into the `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` value in the `.env` file, replacing the placeholder.

The app will show errors if you try to access protected resources before completing this setup.
