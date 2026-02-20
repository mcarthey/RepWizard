using RepWizard.Core.Interfaces;

namespace RepWizard.UI.Services;

/// <summary>
/// MAUI Shell implementation of INavigationService.
/// ViewModels use this via DI injection — they never call Shell.Current directly.
/// </summary>
public class ShellNavigationService : INavigationService
{
    public async Task NavigateToAsync(string route, IDictionary<string, object>? parameters = null)
    {
        if (parameters?.Count > 0)
            await Shell.Current.GoToAsync(route, parameters);
        else
            await Shell.Current.GoToAsync(route);
    }

    public async Task NavigateBackAsync()
        => await Shell.Current.GoToAsync("..");

    public async Task NavigateToRootAsync(string route)
        => await Shell.Current.GoToAsync($"//{route}");
}
