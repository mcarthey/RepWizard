using MediatR;
using RepWizard.Core.Common;

namespace RepWizard.Application.Queries.Workouts.GetLastSessionDefaults;

/// <summary>
/// Returns the last logged weight and reps for each exercise for a given user,
/// used to pre-fill set entry fields on the Active Session screen (progressive overload defaults).
/// </summary>
public record GetLastSessionDefaultsQuery(Guid UserId)
    : IRequest<Result<IReadOnlyDictionary<Guid, LastSetDefault>>>;

public record LastSetDefault(
    decimal? WeightKg,
    int Reps,
    int? RepsInReserve,
    decimal? RPE
);
