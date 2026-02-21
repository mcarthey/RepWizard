using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTrainingProgramById;

public record GetTrainingProgramByIdQuery(Guid ProgramId) : IRequest<Result<TrainingProgramDetailDto>>;
