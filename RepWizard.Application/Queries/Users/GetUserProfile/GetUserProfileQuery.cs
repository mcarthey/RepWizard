using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Users.GetUserProfile;

public record GetUserProfileQuery(Guid UserId) : IRequest<Result<UserDto>>;
