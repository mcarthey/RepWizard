using Android.Provider;

namespace RepWizard.UI.Services;

public partial class MotionPreferenceService
{
    partial void GetPlatformReduceMotionInternal(ref bool result)
    {
        var resolver = Android.App.Application.Context.ContentResolver;
        if (resolver == null) return;

        // TRANSITION_ANIMATION_SCALE == 0 means animations are disabled
        var scale = Settings.Global.GetFloat(resolver, Settings.Global.TransitionAnimationScale, 1f);
        result = scale == 0f;
    }
}
