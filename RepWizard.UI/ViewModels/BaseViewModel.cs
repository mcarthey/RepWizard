using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// Base ViewModel for all RepWizard view models.
/// All ViewModels inherit ObservableObject from CommunityToolkit.Mvvm.
/// Provides common state properties: IsLoading, HasError, ErrorMessage, IsEmpty.
///
/// RULES (enforced here):
/// - No XAML knowledge in ViewModels
/// - No business logic — delegate to Application layer via MediatR
/// - No async void except event handlers
/// - No Service Locator / static App.Current access
/// - No ViewModel > 300 lines (split into sub-ViewModels if needed)
/// </summary>
public abstract partial class BaseViewModel : ObservableObject
{
    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _hasError;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private bool _isEmpty;

    [ObservableProperty]
    private string _title = string.Empty;

    protected void SetError(string message)
    {
        ErrorMessage = message;
        HasError = true;
    }

    protected void ClearError()
    {
        ErrorMessage = string.Empty;
        HasError = false;
    }

    protected async Task ExecuteSafeAsync(Func<Task> action, string errorPrefix = "An error occurred")
    {
        try
        {
            IsLoading = true;
            ClearError();
            await action();
        }
        catch (OperationCanceledException)
        {
            // Cancellation is expected — do not surface as error
        }
        catch (Exception ex)
        {
            SetError($"{errorPrefix}: {ex.Message}");
        }
        finally
        {
            IsLoading = false;
        }
    }
}
