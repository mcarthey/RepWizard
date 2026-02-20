namespace RepWizard.Core.Interfaces;

/// <summary>
/// Navigation service abstraction for ViewModels.
/// ViewModels receive this via constructor injection — never use Shell.Current directly in ViewModels.
/// </summary>
public interface INavigationService
{
    Task NavigateToAsync(string route, IDictionary<string, object>? parameters = null);
    Task NavigateBackAsync();
    Task NavigateToRootAsync(string route);
}
