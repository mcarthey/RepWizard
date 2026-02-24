using Android.App;
using Android.Content.PM;
using Android.OS;
using Android.Runtime;

namespace RepWizard.App;

[Register("com.repwizard.app.MainActivity")]
[Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true,
    ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode |
                           ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
public class MainActivity : MauiAppCompatActivity
{
}
