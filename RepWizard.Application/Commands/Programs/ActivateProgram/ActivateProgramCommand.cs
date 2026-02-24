using MediatR;
using RepWizard.Core.Common;

namespace RepWizard.Application.Commands.Programs.ActivateProgram;

public record ActivateProgramCommand(
    Guid UserId,
    Guid ProgramId
) : IRequest<Result<bool>>;
