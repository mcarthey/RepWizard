namespace RepWizard.Core.Interfaces;

/// <summary>
/// Platform-agnostic abstraction for reading OS-level motion preferences.
/// iOS: AccessibilitySettings.IsReduceMotionEnabled
/// Android: Settings.Global.TRANSITION_ANIMATION_SCALE
/// Implement per-platform via partial classes registered in MauiProgram.cs.
/// </summary>
public interface IMotionPreferenceService
{
    bool IsReduceMotionEnabled { get; }
}
