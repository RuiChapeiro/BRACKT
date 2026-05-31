namespace Brackt.Application.Tournaments;

public sealed record CreateTournamentRequest(string Name, string? Description, int MaxParticipants);

public sealed record TournamentDto(
    Guid Id,
    string Name,
    string? Description,
    string Status,
    int? MaxParticipants,
    string PublicRegistrationToken,
    DateTime CreatedAtUtc);
