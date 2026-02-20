namespace RepWizard.UI.Controls;

public partial class MetricChipView : ContentView
{
    public static readonly BindableProperty IconProperty =
        BindableProperty.Create(nameof(Icon), typeof(string), typeof(MetricChipView), string.Empty);

    public static readonly BindableProperty LabelProperty =
        BindableProperty.Create(nameof(Label), typeof(string), typeof(MetricChipView), string.Empty);

    public static readonly BindableProperty ValueProperty =
        BindableProperty.Create(nameof(Value), typeof(object), typeof(MetricChipView), 0,
            propertyChanged: OnValueChanged);

    public string Icon
    {
        get => (string)GetValue(IconProperty);
        set => SetValue(IconProperty, value);
    }

    public string Label
    {
        get => (string)GetValue(LabelProperty);
        set => SetValue(LabelProperty, value);
    }

    public object Value
    {
        get => GetValue(ValueProperty);
        set => SetValue(ValueProperty, value);
    }

    public MetricChipView()
    {
        InitializeComponent();
    }

    private static void OnValueChanged(BindableObject bindable, object oldValue, object newValue)
    {
        // Phase 5: Implement number roll animation when value changes
        // Only animate when values actually change (not on initial bind)
        // Respect IMotionPreferenceService.IsReduceMotionEnabled
    }
}
