using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Application.Commands.Programs.ActivateProgram;

public class ActivateProgramCommandHandler
    : IRequestHandler<ActivateProgramCommand, Result<bool>>
{
    private readonly ITrainingProgramRepository _programs;

    public ActivateProgramCommandHandler(ITrainingProgramRepository programs)
    {
        _programs = programs;
    }

    public async Task<Result<bool>> Handle(
        ActivateProgramCommand request,
        CancellationToken cancellationToken)
    {
        var program = await _programs.GetByIdAsync(request.ProgramId, cancellationToken);
        if (program == null)
            return Result<bool>.Failure("Program not found.");

        if (program.UserId != request.UserId)
            return Result<bool>.Failure("Program does not belong to this user.");

        if (program.IsActive)
            return Result<bool>.Failure("Program is already active.");

        // Deactivate any currently active program
        await _programs.DeactivateAllForUserAsync(request.UserId, cancellationToken);

        program.Activate();
        _programs.Update(program);
        await _programs.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
