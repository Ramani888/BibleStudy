package com.frontend

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    if (BuildConfig.DEBUG) {
      MobileAds.setRequestConfiguration(
        RequestConfiguration.Builder()
          .setTestDeviceIds(listOf("C794FD34D9965ECFBA466B69684D0B60"))
          .build()
      )
    }
    MobileAds.initialize(this)
    loadReactNative(this)
  }
}
