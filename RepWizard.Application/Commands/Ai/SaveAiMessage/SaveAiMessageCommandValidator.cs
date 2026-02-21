using FluentValidation;

namespace RepWizard.Application.Commands.Ai.SaveAiMessage;

public class SaveAiMessageCommandValidator : AbstractValidator<SaveAiMessageCommand>
{
    private static readonly string[] ValidRoles = { "User", "Assistant", "System" };

    public SaveAiMessageCommandValidator()
    {
        // ConversationId can be Guid.Empty (creates a new conversation), so no NotEmpty rule.

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => ValidRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Role must be 'User', 'Assistant', or 'System'.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.");

        RuleFor(x => x.TokensUsed)
            .GreaterThanOrEqualTo(0).WithMessage("TokensUsed must be 0 or greater.")
            .When(x => x.TokensUsed.HasValue);
    }
}
