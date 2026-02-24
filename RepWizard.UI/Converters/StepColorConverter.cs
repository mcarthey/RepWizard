using System.Globalization;

namespace RepWizard.UI.Converters;

/// <summary>
/// Converts (CurrentStep, ConverterParameter=stepIndex) to a color.
/// Active/past steps get Primary color; future steps get OutlineVariant.
/// </summary>
public class StepColorConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is int currentStep && int.TryParse(parameter?.ToString(), out var stepIndex))
        {
            var key = currentStep >= stepIndex ? "Primary" : "OutlineVariant";
            if (Microsoft.Maui.Controls.Application.Current?.Resources.TryGetValue(key, out var color) == true)
                return color;
        }
        return Colors.Grey;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
