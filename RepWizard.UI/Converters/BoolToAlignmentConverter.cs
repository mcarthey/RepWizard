using System.Globalization;

namespace RepWizard.UI.Converters;

/// <summary>
/// Converts a boolean to a LayoutOptions alignment.
/// True (user message) -> End (right-aligned)
/// False (assistant message) -> Start (left-aligned)
/// </summary>
public class BoolToAlignmentConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isUser)
            return isUser ? LayoutOptions.End : LayoutOptions.Start;
        return LayoutOptions.Start;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
