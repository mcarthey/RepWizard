using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class CoachPage : ContentPage
{
    private readonly CoachViewModel _viewModel;

    public CoachPage(CoachViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        ScrollToLastMessage();
    }

    private void ScrollToLastMessage()
    {
        if (_viewModel.Messages.Count > 0)
        {
            var lastItem = _viewModel.Messages[^1];
            MessagesCollectionView.ScrollTo(lastItem, position: ScrollToPosition.End, animate: false);
        }
    }
}
