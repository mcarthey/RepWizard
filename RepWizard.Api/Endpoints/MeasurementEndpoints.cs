using MediatR;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;
using RepWizard.Application.Queries.Measurements.GetMeasurementHistory;
using RepWizard.Application.Queries.Measurements.GetProgressChartData;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class MeasurementEndpoints
{
    public static IEndpointRouteBuilder MapMeasurementEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/measurements")
            .WithTags("Measurements");

        // POST /api/v1/measurements — log a body measurement
        group.MapPost("/", async (
            LogBodyMeasurementRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new LogBodyMeasurementCommand(
                request.UserId,
                request.WeightKg,
                request.BodyFatPercent,
                request.MuscleKg,
                request.MeasurementNotes), ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/measurements/{result.Value!.Id}",
                    ApiResponse<BodyMeasurementDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("LogBodyMeasurement")
        .WithSummary("Log a body composition measurement");

        // GET /api/v1/measurements?userId={id}&limit={n} — measurement history
        group.MapGet("/", async (
            Guid userId,
            int? limit,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetMeasurementHistoryQuery(userId, limit), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<IReadOnlyList<BodyMeasurementDto>>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetMeasurementHistory")
        .WithSummary("Get body measurement history for a user");

        // GET /api/v1/measurements/progress-chart?userId={id}&weeksBack={n}
        group.MapGet("/progress-chart", async (
            Guid userId,
            int weeksBack = 12,
            IMediator mediator = default!,
            CancellationToken ct = default) =>
        {
            var result = await mediator.Send(new GetProgressChartDataQuery(userId, weeksBack), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<ProgressChartDataDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetProgressChartData")
        .WithSummary("Get aggregated progress chart data for a user");

        return app;
    }
}
