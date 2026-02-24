using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Programs.CreateTrainingProgram;

public record CreateTrainingProgramCommand(
    Guid UserId,
    string Name,
    int DurationWeeks,
    string GoalDescription,
    bool GeneratedByAi,
    string? AiReasoning,
    bool ActivateImmediately,
    IList<ProgramDayInput> Days
) : IRequest<Result<TrainingProgramDetailDto>>;
