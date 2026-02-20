using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Infrastructure.Data;
using RepWizard.Infrastructure.Repositories;

namespace RepWizard.Tests.Infrastructure;

/// <summary>
/// Integration tests for the Repository pattern using SQLite in-memory database.
/// Tests verify data access works correctly end-to-end through EF Core.
/// </summary>
public class RepositoryIntegrationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly Repository<User> _userRepo;

    public RepositoryIntegrationTests()
    {
        // Use SQLite in-memory with a persistent connection to keep the DB alive during the test
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _userRepo = new Repository<User>(_context);
    }

    [Fact]
    public async Task Repository_AddAsync_PersistsEntity()
    {
        // Arrange
        var user = CreateUser();

        // Act
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        // Assert
        var retrieved = await _userRepo.GetByIdAsync(user.Id);
        retrieved.Should().NotBeNull();
        retrieved!.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task Repository_GetAllAsync_ReturnsAllNonDeletedEntities()
    {
        // Arrange
        var user1 = CreateUser("user1@test.com");
        var user2 = CreateUser("user2@test.com");
        var deletedUser = CreateUser("deleted@test.com");
        deletedUser.IsDeleted = true;

        await _userRepo.AddAsync(user1);
        await _userRepo.AddAsync(user2);
        await _userRepo.AddAsync(deletedUser);
        await _userRepo.SaveChangesAsync();

        // Act
        var all = await _userRepo.GetAllAsync();

        // Assert
        all.Should().HaveCount(2);
        all.Should().NotContain(u => u.IsDeleted);
    }

    [Fact]
    public async Task Repository_Delete_SoftDeletesEntity()
    {
        // Arrange
        var user = CreateUser();
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        // Act
        _userRepo.Delete(user);
        await _userRepo.SaveChangesAsync();

        // Assert — soft delete means IsDeleted = true, entity still in DB
        var retrieved = await _userRepo.GetByIdAsync(user.Id);
        retrieved.Should().BeNull(); // filtered by global query filter

        // But it still exists in the DB (bypass global filter)
        var withDeleted = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == user.Id);
        withDeleted.Should().NotBeNull();
        withDeleted!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task Repository_Update_ModifiesEntity()
    {
        // Arrange
        var user = CreateUser();
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        // Act
        user.Name = "Updated Name";
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        // Assert
        var retrieved = await _userRepo.GetByIdAsync(user.Id);
        retrieved!.Name.Should().Be("Updated Name");
    }

    [Fact]
    public async Task AppDbContext_SaveChanges_UpdatesAuditFields()
    {
        // Arrange
        var user = CreateUser();
        var beforeAdd = DateTime.UtcNow;

        // Act
        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        // Assert
        user.CreatedAt.Should().BeOnOrAfter(beforeAdd);
        user.UpdatedAt.Should().BeOnOrAfter(beforeAdd);
    }

    private static User CreateUser(string email = "test@test.com") => new()
    {
        Name = "Test User",
        Email = email,
        FitnessGoal = FitnessGoal.MuscleHypertrophy,
        ExperienceLevel = ExperienceLevel.Intermediate
    };

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
