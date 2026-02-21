using System.Globalization;

namespace RepWizard.UI.Converters;

public class GreaterThanZeroConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return value switch
        {
            int i => i > 0,
            double d => d > 0,
            float f => f > 0,
            decimal m => m > 0,
            long l => l > 0,
            _ => false
        };
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
