using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTrainingPrograms;

public record GetTrainingProgramsQuery(Guid UserId) : IRequest<Result<IReadOnlyList<TrainingProgramDto>>>;
