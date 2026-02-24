using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ProgramBuilderPage : ContentPage
{
    public ProgramBuilderPage(ProgramBuilderViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is ProgramBuilderViewModel vm)
            vm.LoadCommand.Execute(null);
    }
}
