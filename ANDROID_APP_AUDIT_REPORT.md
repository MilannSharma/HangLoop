# Hangloop Android App Audit Report

**Audit date:** 28 August 2026  
**Scope:** Android startup/close behaviour, APK delivery, icon/splash branding, Expo/native configuration, and source-build reproducibility.  
**Exact runtime crash stack trace:** captured on the affected Vivo I2219, Android 16 / API 36, on 28 August 2026.

## Executive result

The inspected `Store/hangloop-v1.0.0.apk` is a **standalone Hangloop Android APK**, not an Expo Go application. Its package is `com.hangloop.app`, its launcher label is `Hangloop`, and it has the expected native Google Sign-In dependency merged into it.

However, the release process is unsafe. There are at least two different APKs named and versioned identically, and the native Android project that determines the launcher icon and splash screen is ignored by Git. This is the strongest evidence for users receiving an old/different build and seeing unexpected branding or startup behaviour.

The reported immediate close is now proven: a mixed Expo native dependency set crashes before the JavaScript app mounts. This is a native binary incompatibility, not a network, session, React UI, icon, or device-specific error.

**Testing clarification (28 Aug 2026):** the current tester is installing the APK directly from this codebase (`Store/hangloop-v1.0.0.apk`), not through the website. The duplicate-APK finding remains a release defect, but is **not considered the cause of this tester's immediate-close issue**.

## Findings, priority order

| Priority | Finding | Evidence | Consequence | Confidence |
|---|---|---|---|---|
| P0 | **Confirmed startup crash: incompatible Expo native modules.** | Device logcat: `java.lang.NoSuchMethodError: No static method getDirectConverter(...)` at `expo.modules.font.FontLoaderModule.definition(FontLoaderModule.kt:98)`. `expo-font@57.0.1` is calling an API absent from `expo-modules-core@3.0.30`. | Process dies before React/JS renders, so the app visibly opens and immediately closes. | **Confirmed** |
| P0 | Dependency resolver mixed Expo SDK 54 and SDK 57 packages. | `expo@54.0.37` embeds `expo-font~14.0.12` and `expo-modules-core@3.0.30`. `npm ls` shows `@expo/vector-icons@15.1.1 -> expo-font@57.0.1`, hoisted/autolinked at the project root. | The Android APK packages Font Module 57 with Expo Modules Core 3; they are binary-incompatible. | **Confirmed** |
| P0 | Multiple APKs use the same identity but are different binaries. | `Store/hangloop-v1.0.0.apk` is 68,326,947 bytes, SHA-256 `0A7CDC…D172A`, built 28 Aug. `Landing page/builds/hangloop-v1.0.0.apk` is 71,907,646 bytes, SHA-256 `F83D9F…AA854`, built 20 Aug. Both report package `com.hangloop.app`, version `1.0.0`, versionCode `1`. | Users cannot reliably know which build they installed. Android updates require a higher versionCode; a changed APK with versionCode 1 is not a valid update path. | High |
| P0 | APK distribution is not tied to the verified Store artifact. | The website code downloads a fixed GitHub release URL (`.../releases/download/Apk/hangloop-v1.0.0.apk`), while the latest artifact exists under `Store/`. The local landing-site `builds/` folder is old and has a different APK. | The public download can remain stale even when `Store/` is rebuilt. The reported app may be an older build. | High for the mismatch; Medium for the actual public asset, which needs a live download check. |
| P1 | Android native configuration is generated but ignored. | `mobile/.gitignore` ignores `/android` and `/ios`; `git ls-files mobile/android` returns zero tracked files. The installed APK is built from that ignored `mobile/android` directory. | Icon, splash, manifest, Gradle, and native dependency changes are not reproducible from the repository. A clean build can silently generate different resources/configuration. | High |
| P1 | Splash/icon configuration has two sources of truth. | `mobile/app.json` points to Expo asset settings. Ignored native resources additionally contain manually generated launcher mipmaps and a custom `Theme.App.SplashScreen`. | Editing `app.json` alone will not guarantee that the shipped native APK reflects it. This explains why expected Hangloop branding can differ on device. | High |
| P1 | The current splash path is custom/native, not a clean managed Expo splash setup. | `MainActivity` launches with `Theme.App.SplashScreen`; that theme manually uses `@drawable/ic_launcher_background`, which renders `splashscreen_logo.png`. The app config uses `splash.image: ./assets/logo.png`; the native files are manually produced by `generate_icons.ps1`. | It can look like a generic/template/Expo launch screen on some Android versions or after a rebuild. It is not deterministic from tracked source. | High |
| P1 | The latest JS error boundary cannot protect native startup crashes. | `App.tsx` has `RootErrorBoundary`, but React error boundaries only cover rendering/lifecycle child errors. They do not catch a Kotlin/Java/JNI/native-module crash before React mounts. | “Open hote hi band” can still occur with no recovery screen. The current boundary does not diagnose or prevent a native crash. | High |
| P2 | The production APK is signed with the default debug keystore. | `mobile/android/app/build.gradle` configures `release` with `signingConfigs.debug`. | Not suitable for a trusted production release. Releasing a later build with a different keystore will prevent updates over existing installations. | High |
| P2 | `versionCode` is still `1`. | Both `mobile/app.json` and native Gradle config set versionCode `1`; Store manifest also reports it. | Any future correct update must increment it. Current users may need uninstall/reinstall depending on the signing history. | High |
| P2 | The external native sign-in module is present but device validation is missing. | `@react-native-google-signin/google-signin` is installed and registered; manifest merge confirms Google activities/services. | Its native setup is not the strongest startup suspect, but it must be tested on a real Android device, especially on first launch and Google-sign-in tap. | Medium |
| P3 | Claimed background audio is not established by this code/configuration. | APK requests media foreground-service permission, but the app’s player is a YouTube WebView/iframe; no dedicated native audio playback service/library was found. | Background playback/lock-screen controls should be treated as unverified product claims. | Medium |

## Confirmed device reproduction

The Store APK was installed and cold-launched on the connected Vivo I2219 (Android 16). Android successfully started `com.hangloop.app/.MainActivity` in 427 ms, then killed the process when Expo began registering native modules. The relevant logcat sequence was:

```text
FATAL EXCEPTION: pool-4-thread-1
Process: com.hangloop.app
java.lang.NoSuchMethodError: No static method getDirectConverter(...)
  at expo.modules.font.FontLoaderModule.definition(FontLoaderModule.kt:98)
```

This conclusively explains the immediate close. The earlier App Clone profile was not a valid test target: it contained a stale package record but showed `installed=false` for clone user 999. The confirmed crash above was reproduced from the normal Owner profile (user 0).

## Required code/build correction

Keep all Expo modules on the Expo SDK 54 compatibility line. In particular, pin a compatible root `expo-font` version (`~14.0.12`) and replace broad Expo package ranges with the SDK-compatible versions produced by `expo install`. Then regenerate/rebuild Android from a clean native build and retest the exact cold launch on the device.

Do **not** solve this by changing Kotlin code, adding a catch block, changing the splash screen, or disabling Android 16 support. None of those addresses the missing native method.

## What is *not* the problem

- The current Store APK’s application label is `Hangloop`; its package is `com.hangloop.app`.
- The APK includes an embedded JavaScript bundle (`assets/index.android.bundle`), so it does not require Expo Go or a Metro server to launch.
- The current source type-check completed without reported TypeScript errors.
- Startup JS is defensive: storage and session restore are wrapped in `try/catch`; a normal network/API failure should lead to the login screen, not close the process.

`expo` appears in the project because the app uses the Expo SDK and Expo modules. That is normal for a standalone Android build. Expo branding on screen is therefore a release/configuration symptom, not proof that the app is running inside Expo Go.

## Exact explanation for the observed behaviour

1. The tester installs the verified latest `Store/hangloop-v1.0.0.apk` directly. Therefore the website/GitHub artifact mismatch is excluded for this reproduction.
2. Autolinking discovers and packages `expo-font@57.0.1`, while the Expo 54 runtime packages `expo-modules-core@3.0.30`.
3. FontLoader invokes `getDirectConverter`, which only exists in a newer Expo Modules Core API. The method is absent in the APK's Core 3 runtime.
4. Android throws `NoSuchMethodError` and kills the process before the JavaScript bundle can display the app or its recovery boundary.

## Verification already completed

The following was run on the affected phone to collect the crash proof:

```powershell
adb logcat -c
adb shell am force-stop com.hangloop.app
adb shell monkey -p com.hangloop.app 1
adb logcat -d -v time | Select-String 'FATAL EXCEPTION|AndroidRuntime|com.hangloop.app|ReactNativeJS|Expo|SIGABRT'
```

Device: Vivo I2219; Android 16/API 36; cold launch. The first `FATAL EXCEPTION` is included above and identifies the fix target.

## Recommended correction plan

1. Pin/repair Expo SDK 54 package compatibility first: root `expo-font` must be `~14.0.12`; use `expo install` to set supported Expo package versions and remove the incompatible `expo-font@57.0.1` lockfile resolution.
2. Clean/rebuild the Android native project, then reinstall and cold-launch the new APK on this Vivo device. The absence of the `NoSuchMethodError` is the acceptance criterion.
3. Stop distributing all duplicate artifacts. Keep one authoritative release artifact and verify its SHA-256 before publishing.
4. Release a new Android build with a new semantic version (for example `1.0.1`) and a higher `versionCode` (at least `2`). Update the website/GitHub release link to that exact file.
5. Create and preserve a real upload/release keystore. Do not ship new production builds signed by the debug keystore.
6. Make native configuration reproducible: either commit the Android project, or remove generated native folders from the release workflow and regenerate with a documented Expo prebuild command in CI.
7. Use one splash/icon pipeline only. Prefer the Expo configuration/plugin flow and regenerate the native project; remove the manual resource overrides unless they are deliberately tracked and tested.
8. Add a CI release gate: package compatibility check, type-check, Android release build, cold launch test, APK version/signing validation, and SHA-256 generation.

## Audit limitations

No application source/dependency modification was made in this audit. The exact close-on-launch root cause is **confirmed** by the affected device's logcat. The release/configuration defects above should also be fixed before publication.
