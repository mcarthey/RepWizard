using FluentAssertions;
using RepWizard.Application.Services;

namespace RepWizard.Tests.Application.Services;

public class QuickStartTemplatesTests
{
    [Fact]
    public void GetAll_Returns5Templates()
    {
        var templates = QuickStartTemplates.GetAll();

        templates.Should().HaveCount(5);
    }

    [Fact]
    public void GetAll_AllTemplatesHaveRequiredFields()
    {
        var templates = QuickStartTemplates.GetAll();

        foreach (var t in templates)
        {
            t.Id.Should().NotBeNullOrWhiteSpace();
            t.Name.Should().NotBeNullOrWhiteSpace();
            t.Description.Should().NotBeNullOrWhiteSpace();
            t.MinExperienceLevel.Should().NotBeNullOrWhiteSpace();
            t.PrimaryGoal.Should().NotBeNullOrWhiteSpace();
            t.DaysPerWeek.Should().BeGreaterThan(0);
            t.DurationWeeks.Should().BeGreaterThan(0);
            t.SplitType.Should().NotBeNullOrWhiteSpace();
            t.SessionLengthMinutes.Should().BeGreaterThan(0);
            t.Tags.Should().NotBeEmpty();
        }
    }

    [Fact]
    public void GetAll_TemplateIdsAreUnique()
    {
        var templates = QuickStartTemplates.GetAll();

        templates.Select(t => t.Id).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void GetById_ExistingId_ReturnsTemplate()
    {
        var template = QuickStartTemplates.GetById("3day-fullbody");

        template.Should().NotBeNull();
        template!.Name.Should().Be("3-Day Full Body");
        template.DaysPerWeek.Should().Be(3);
    }

    [Fact]
    public void GetById_NonExistingId_ReturnsNull()
    {
        var template = QuickStartTemplates.GetById("nonexistent");

        template.Should().BeNull();
    }
}
