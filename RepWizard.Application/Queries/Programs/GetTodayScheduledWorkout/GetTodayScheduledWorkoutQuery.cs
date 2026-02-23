using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTodayScheduledWorkout;

public record GetTodayScheduledWorkoutQuery(Guid UserId) : IRequest<Result<ScheduledWorkoutDto?>>;
