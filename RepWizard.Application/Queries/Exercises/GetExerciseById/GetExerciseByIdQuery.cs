using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExerciseById;

public record GetExerciseByIdQuery(Guid ExerciseId) : IRequest<Result<ExerciseDto>>;
