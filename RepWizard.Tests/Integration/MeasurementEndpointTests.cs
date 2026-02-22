using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Integration;

public class MeasurementEndpointTests : IntegrationTestBase
{
    [Fact]
    public async Task LogMeasurement_ValidRequest_ReturnsCreated()
    {
        var (auth, _) = await RegisterTestUser();

        var request = new LogBodyMeasurementRequest
        {
            UserId = auth.UserId,
            WeightKg = 80.5m
        };

        var response = await Client.PostAsJsonAsync("/api/v1/measurements", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<BodyMeasurementDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Id.Should().NotBeEmpty();
        body.Data.WeightKg.Should().Be(80.5m);
    }

    [Fact]
    public async Task LogMeasurement_NoMetrics_ReturnsBadRequest()
    {
        var (auth, _) = await RegisterTestUser();

        var request = new LogBodyMeasurementRequest
        {
            UserId = auth.UserId
            // All metric fields null
        };

        var response = await Client.PostAsJsonAsync("/api/v1/measurements", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetMeasurementHistory_ReturnsList()
    {
        var (auth, _) = await RegisterTestUser();

        // Log a measurement first
        var logRequest = new LogBodyMeasurementRequest
        {
            UserId = auth.UserId,
            WeightKg = 80.0m
        };
        await Client.PostAsJsonAsync("/api/v1/measurements", logRequest);

        var response = await Client.GetAsync(
            $"/api/v1/measurements?userId={auth.UserId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<BodyMeasurementDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetMeasurementHistory_WithLimit_RespectsLimit()
    {
        var (auth, _) = await RegisterTestUser();

        // Log 3 measurements
        for (var i = 1; i <= 3; i++)
        {
            var logRequest = new LogBodyMeasurementRequest
            {
                UserId = auth.UserId,
                WeightKg = 78m + i
            };
            await Client.PostAsJsonAsync("/api/v1/measurements", logRequest);
        }

        var response = await Client.GetAsync(
            $"/api/v1/measurements?userId={auth.UserId}&limit=2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<BodyMeasurementDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetProgressChart_ReturnsChartData()
    {
        var (auth, _) = await RegisterTestUser();

        // Log a measurement so chart has data
        var logRequest = new LogBodyMeasurementRequest
        {
            UserId = auth.UserId,
            WeightKg = 80.0m
        };
        await Client.PostAsJsonAsync("/api/v1/measurements", logRequest);

        var response = await Client.GetAsync(
            $"/api/v1/measurements/progress-chart?userId={auth.UserId}&weeksBack=4");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<ProgressChartDataDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.WeeklyVolume.Should().NotBeNull();
        body.Data.StrengthTrends.Should().NotBeNull();
        body.Data.BodyComposition.Should().NotBeNull();
    }
}
