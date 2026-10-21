# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# --- R8 enabled for release (Play "DEX code optimization" warning, 2026-10-15) ---
# Keep real file/line numbers; Crashlytics uploads the mapping file to de-obfuscate them.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# react-native-config reads the .env values from BuildConfig by reflection.
# build_config_package (strings.xml) points it at the namespace package, not applicationId.
-keep class com.biblestudypro.app.BuildConfig { *; }

# react-native-pdf: pdfium's native code calls back into these Java classes by name.
-keep class io.legere.pdfiumandroid.** { *; }
-keep class com.shockwave.pdfium.** { *; }
