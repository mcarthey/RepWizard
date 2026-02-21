using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Users.UpdateProfile;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands.Users;

public class UpdateProfileCommandHandlerTests
{
    private readonly Mock<IUserRepository> _usersRepo = new();
    private readonly UpdateProfileCommandHandler _handler;

    public UpdateProfileCommandHandlerTests()
    {
        _handler = new UpdateProfileCommandHandler(_usersRepo.Object);
    }

    [Fact]
    public async Task Handle_ValidUpdate_ReturnsUpdatedProfile()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Name = "Old Name",
            Email = "test@example.com",
            PasswordHash = "hash",
            FitnessGoal = FitnessGoal.GeneralFitness,
            ExperienceLevel = ExperienceLevel.Beginner
        };
        _usersRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var command = new UpdateProfileCommand(userId, "New Name", null, 175.5m, 80.0m,
            "StrengthGain", "Intermediate", null);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("New Name");
        result.Value.HeightCm.Should().Be(175.5m);
        result.Value.WeightKg.Should().Be(80.0m);
        result.Value.FitnessGoal.Should().Be("StrengthGain");
        result.Value.ExperienceLevel.Should().Be("Intermediate");
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsFailure()
    {
        _usersRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var command = new UpdateProfileCommand(Guid.NewGuid(), "Name", null, null, null, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_PartialUpdate_OnlyChangesProvidedFields()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Name = "Original",
            Email = "test@example.com",
            PasswordHash = "hash",
            HeightCm = 170m,
            WeightKg = 75m
        };
        _usersRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        // Only update weight, leave everything else
        var command = new UpdateProfileCommand(userId, null, null, null, 82.5m, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Name.Should().Be("Original"); // Unchanged
        result.Value.HeightCm.Should().Be(170m); // Unchanged
        result.Value.WeightKg.Should().Be(82.5m); // Updated
    }
}
