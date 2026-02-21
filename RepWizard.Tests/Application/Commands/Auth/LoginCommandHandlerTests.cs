using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Auth.Login;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Tests.Application.Commands.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUserRepository> _usersRepo = new();
    private readonly Mock<IAuthService> _authService = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_usersRepo.Object, _authService.Object);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsTokens()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = "hashed"
        };
        _usersRepo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _authService.Setup(a => a.VerifyPassword("password123", "hashed")).Returns(true);
        _authService.Setup(a => a.GenerateTokens(user.Id, user.Email, user.Name))
            .Returns(new AuthTokens("access", "refresh", DateTime.UtcNow.AddHours(1)));

        var result = await _handler.Handle(new LoginCommand("test@example.com", "password123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AccessToken.Should().Be("access");
        result.Value.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task Handle_InvalidEmail_ReturnsFailure()
    {
        _usersRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var result = await _handler.Handle(new LoginCommand("wrong@example.com", "pass"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Invalid email or password");
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsFailure()
    {
        var user = new User { Email = "test@example.com", PasswordHash = "hash" };
        _usersRepo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _authService.Setup(a => a.VerifyPassword("wrong", "hash")).Returns(false);

        var result = await _handler.Handle(new LoginCommand("test@example.com", "wrong"), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Invalid email or password");
    }
}
