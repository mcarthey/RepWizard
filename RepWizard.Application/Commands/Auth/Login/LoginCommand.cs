using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;
