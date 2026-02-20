using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.LogSet;

public record LogSetCommand(
    Guid SessionId,
    Guid ExerciseId,
    int SetNumber,
    decimal? WeightKg,
    int Reps,
    int? RepsInReserve,
    decimal? RPE,
    string SetType,
    int? DurationSeconds
) : IRequest<Result<ExerciseSetDto>>;
