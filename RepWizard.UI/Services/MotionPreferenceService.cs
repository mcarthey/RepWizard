using RepWizard.Core.Interfaces;

namespace RepWizard.UI.Services;

/// <summary>
/// Cross-platform motion preference service.
/// Platform-specific implementations check OS reduce-motion settings.
/// iOS: UIAccessibility.IsReduceMotionEnabled
/// Android: Settings.Global.TRANSITION_ANIMATION_SCALE == 0
/// Fallback: always returns false (animations enabled).
/// </summary>
public partial class MotionPreferenceService : IMotionPreferenceService
{
    public bool IsReduceMotionEnabled => GetPlatformReduceMotion();

    partial void GetPlatformReduceMotionInternal(ref bool result);

    private bool GetPlatformReduceMotion()
    {
        bool result = false;
        GetPlatformReduceMotionInternal(ref result);
        return result;
    }
}
