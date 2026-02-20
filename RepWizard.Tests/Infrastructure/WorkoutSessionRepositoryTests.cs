using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Infrastructure.Data;
using RepWizard.Infrastructure.Repositories;

namespace RepWizard.Tests.Infrastructure;

/// <summary>
/// Integration tests for WorkoutSessionRepository.
/// </summary>
public class WorkoutSessionRepositoryTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly WorkoutSessionRepository _repo;
    private readonly Guid _userId;

    public WorkoutSessionRepositoryTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _repo = new WorkoutSessionRepository(_context);
        _userId = SeedUser();
    }

    [Fact]
    public async Task GetActiveSessionForUserAsync_ReturnsActiveSession()
    {
        // Arrange
        var session = new WorkoutSession
        {
            UserId = _userId,
            StartedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(session);
        await _repo.SaveChangesAsync();

        // Act
        var active = await _repo.GetActiveSessionForUserAsync(_userId);

        // Assert
        active.Should().NotBeNull();
        active!.Id.Should().Be(session.Id);
    }

    [Fact]
    public async Task GetActiveSessionForUserAsync_ReturnsNullWhenAllCompleted()
    {
        // Arrange
        var session = new WorkoutSession
        {
            UserId = _userId,
            StartedAt = DateTime.UtcNow.AddHours(-1),
            CompletedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(session);
        await _repo.SaveChangesAsync();

        // Act
        var active = await _repo.GetActiveSessionForUserAsync(_userId);

        // Assert
        active.Should().BeNull();
    }

    [Fact]
    public async Task GetRecentSessionsAsync_ReturnsSessionsWithinDayRange()
    {
        // Arrange
        var recentSession = new WorkoutSession
        {
            UserId = _userId,
            StartedAt = DateTime.UtcNow.AddDays(-3),
            CompletedAt = DateTime.UtcNow.AddDays(-3).AddHours(1)
        };
        var oldSession = new WorkoutSession
        {
            UserId = _userId,
            StartedAt = DateTime.UtcNow.AddDays(-20),
            CompletedAt = DateTime.UtcNow.AddDays(-20).AddHours(1)
        };
        await _repo.AddAsync(recentSession);
        await _repo.AddAsync(oldSession);
        await _repo.SaveChangesAsync();

        // Act
        var recent = await _repo.GetRecentSessionsAsync(_userId, days: 14);

        // Assert
        recent.Should().HaveCount(1);
        recent.First().Id.Should().Be(recentSession.Id);
    }

    private Guid SeedUser()
    {
        var user = new User
        {
            Name = "Test User",
            Email = "test@test.com"
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        return user.Id;
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
