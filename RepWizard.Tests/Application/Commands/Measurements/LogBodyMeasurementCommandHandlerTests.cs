using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands.Measurements;

public class LogBodyMeasurementCommandHandlerTests
{
    private readonly Mock<IBodyMeasurementRepository> _repo = new();
    private readonly LogBodyMeasurementCommandHandler _handler;

    public LogBodyMeasurementCommandHandlerTests()
    {
        _handler = new LogBodyMeasurementCommandHandler(_repo.Object);
    }

    [Fact]
    public async Task Handle_AllValues_SavesAndReturnsDto()
    {
        // Arrange
        _repo.Setup(r => r.AddAsync(It.IsAny<BodyMeasurement>(), default)).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new LogBodyMeasurementCommand(Guid.NewGuid(), 80m, 15m, 68m, "Feeling good");

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.WeightKg.Should().Be(80m);
        result.Value.BodyFatPercent.Should().Be(15m);
        result.Value.MuscleKg.Should().Be(68m);
        result.Value.MeasurementNotes.Should().Be("Feeling good");
        // Lean body mass = 80 * (1 - 15/100) = 68 kg
        result.Value.LeanBodyMassKg.Should().Be(68m);
    }

    [Fact]
    public async Task Handle_WeightOnly_SavesSuccessfully()
    {
        // Arrange
        _repo.Setup(r => r.AddAsync(It.IsAny<BodyMeasurement>(), default)).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new LogBodyMeasurementCommand(Guid.NewGuid(), 85m, null, null, null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.WeightKg.Should().Be(85m);
        result.Value.BodyFatPercent.Should().BeNull();
        result.Value.LeanBodyMassKg.Should().BeNull();
    }

    [Fact]
    public async Task Handle_PersistsToRepository()
    {
        // Arrange
        BodyMeasurement? saved = null;
        _repo.Setup(r => r.AddAsync(It.IsAny<BodyMeasurement>(), default))
             .Callback<BodyMeasurement, CancellationToken>((m, _) => saved = m)
             .Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(default)).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var command = new LogBodyMeasurementCommand(userId, 75m, 20m, null, null);

        // Act
        await _handler.Handle(command, default);

        // Assert
        saved.Should().NotBeNull();
        saved!.UserId.Should().Be(userId);
        saved.WeightKg.Should().Be(75m);
        _repo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }
}
