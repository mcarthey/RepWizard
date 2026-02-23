using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class AiChatPage : ContentPage
{
    private readonly AiChatViewModel _viewModel;

    public AiChatPage(AiChatViewModel viewModel)
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
