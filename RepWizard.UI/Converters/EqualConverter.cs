using System.Globalization;

namespace RepWizard.UI.Converters;

/// <summary>
/// Returns true if the bound value equals the ConverterParameter.
/// Used for step-based visibility: IsVisible="{Binding CurrentStep, Converter={StaticResource EqualConverter}, ConverterParameter=0}"
/// </summary>
public class EqualConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value == null || parameter == null) return false;
        return value.ToString() == parameter.ToString();
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
