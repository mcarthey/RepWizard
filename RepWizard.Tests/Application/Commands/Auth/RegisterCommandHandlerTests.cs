using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Auth.Register;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Tests.Application.Commands.Auth;

public class RegisterCommandHandlerTests
{
    private readonly Mock<IUserRepository> _usersRepo = new();
    private readonly Mock<IAuthService> _authService = new();
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _handler = new RegisterCommandHandler(_usersRepo.Object, _authService.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_CreatesUserAndReturnsTokens()
    {
        _usersRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _authService.Setup(a => a.HashPassword(It.IsAny<string>()))
            .Returns("hashed-password");
        _authService.Setup(a => a.GenerateTokens(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new AuthTokens("access-token", "refresh-token", DateTime.UtcNow.AddHours(1)));

        var command = new RegisterCommand("Test User", "test@example.com", "password123", "StrengthGain", "Beginner");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AccessToken.Should().Be("access-token");
        result.Value.RefreshToken.Should().Be("refresh-token");
        result.Value.Name.Should().Be("Test User");
        result.Value.Email.Should().Be("test@example.com");
        _usersRepo.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _usersRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ReturnsFailure()
    {
        _usersRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new RegisterCommand("Test", "existing@example.com", "password123", null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already exists");
        _usersRepo.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ValidGoalAndLevel_SetsEnumsCorrectly()
    {
        _usersRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _authService.Setup(a => a.HashPassword(It.IsAny<string>())).Returns("hash");
        _authService.Setup(a => a.GenerateTokens(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new AuthTokens("tok", "ref", DateTime.UtcNow.AddHours(1)));

        User? capturedUser = null;
        _usersRepo.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, _) => capturedUser = u);

        var command = new RegisterCommand("User", "new@ex.com", "pass1234", "MuscleHypertrophy", "Intermediate");
        await _handler.Handle(command, CancellationToken.None);

        capturedUser.Should().NotBeNull();
        capturedUser!.FitnessGoal.Should().Be(Core.Enums.FitnessGoal.MuscleHypertrophy);
        capturedUser.ExperienceLevel.Should().Be(Core.Enums.ExperienceLevel.Intermediate);
    }
}
