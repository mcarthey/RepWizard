using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class CoachPage : ContentPage
{
    public CoachPage(CoachViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
