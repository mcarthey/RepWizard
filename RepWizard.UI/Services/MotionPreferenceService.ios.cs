#if IOS || MACCATALYST
using UIKit;

namespace RepWizard.UI.Services;

public partial class MotionPreferenceService
{
    partial void GetPlatformReduceMotionInternal(ref bool result)
    {
        result = UIAccessibility.IsReduceMotionEnabled;
    }
}
#endif
