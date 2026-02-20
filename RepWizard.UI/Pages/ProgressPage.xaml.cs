using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ProgressPage : ContentPage
{
    public ProgressPage(ProgressViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
