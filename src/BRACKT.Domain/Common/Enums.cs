namespace Brackt.Domain.Common;

/// <summary>Platform-level authorization role. Tournament-scoped roles are modelled separately.</summary>
public enum SystemRole
{
    Player = 0,
    Organizer = 1,
    Moderator = 2,
    Admin = 3
}

/// <summary>
/// RF2.1 — the three team complexity tiers. The tier gates which roster
/// operations are legal (see <c>Team</c>), it is not just a display label.
/// </summary>
public enum TeamTier
{
    /// <summary>Name only — no roster.</summary>
    Basic = 0,
    /// <summary>Roster of admin-managed ghost players.</summary>
    Intermediate = 1,
    /// <summary>Roster of invited, authenticated real users.</summary>
    Advanced = 2
}

/// <summary>RF3.1–RF3.4 — supported bracket/stage formats. The engine interprets these.</summary>
public enum TournamentFormat
{
    SingleElimination = 0,
    DoubleElimination = 1,
    RoundRobin = 2,
    Swiss = 3
}

/// <summary>How a stage's participants are ordered into slots.</summary>
public enum SeedingMethod
{
    Manual = 0,
    Random = 1,
    /// <summary>Carried over from a previous stage's standings (e.g. group → playoff).</summary>
    FromStandings = 2
}

public enum TournamentStatus
{
    Draft = 0,
    RegistrationOpen = 1,
    RegistrationClosed = 2,
    Seeding = 3,
    InProgress = 4,
    Completed = 5,
    Cancelled = 6
}

public enum MatchStatus
{
    Pending = 0,      // slot exists but participants not yet known
    Scheduled = 1,    // participants + time assigned
    CheckedIn = 2,    // lobby check-in complete
    Live = 3,
    AwaitingResult = 4,
    Completed = 5,
    Walkover = 6,
    Cancelled = 7
}

/// <summary>Outcome from the perspective of a single match participant.</summary>
public enum MatchOutcome
{
    Undecided = 0,
    Win = 1,
    Draw = 2,
    Loss = 3
}

/// <summary>Which bracket a match belongs to (relevant for double elimination).</summary>
public enum BracketSide
{
    Main = 0,        // upper bracket / the only bracket in single elim
    Lower = 1,       // losers bracket
    GrandFinal = 2
}

/// <summary>RF4.1/RF4.2 — primitive type of a configurable metric value.</summary>
public enum MetricDataType
{
    Integer = 0,
    Decimal = 1,
    Boolean = 2,
    Duration = 3,   // stored as seconds
    Text = 4
}

/// <summary>RF4.2 — whether a metric is recorded directly or derived by formula.</summary>
public enum MetricKind
{
    /// <summary>Entered by a scorekeeper (goals, kills, cards…).</summary>
    Simple = 0,
    /// <summary>Computed from other metrics via <c>MetricDefinition.Formula</c> (K/D, goal diff…).</summary>
    Calculated = 1
}

/// <summary>Scope at which a metric value is captured.</summary>
public enum MetricScope
{
    PerMatchParticipant = 0,  // a team's tally within one match
    PerPlayerPerMatch = 1     // an individual player's tally within one match
}

/// <summary>RF4.5 — the available ordered tie-breaker criteria for the funnel.</summary>
public enum TieBreakerType
{
    Points = 0,
    HeadToHead = 1,
    /// <summary>Difference of a chosen metric (e.g. goal difference). Targets a MetricDefinition.</summary>
    MetricDifference = 2,
    /// <summary>Raw "for" total of a chosen metric (e.g. goals scored).</summary>
    MetricFor = 3,
    Wins = 4,
    /// <summary>Direct comparison of matches won between the exact tied set.</summary>
    HeadToHeadWins = 5,
    /// <summary>Fewest disciplinary points (cards) — a chosen metric, ascending.</summary>
    MetricAgainstAscending = 6,
    DrawOfLots = 7
}

/// <summary>Direction a tie-breaker criterion sorts in.</summary>
public enum SortDirection
{
    Descending = 0,  // higher is better (points, goal diff)
    Ascending = 1    // lower is better (cards, fouls)
}

/// <summary>RF1.3 lifecycle of a player profile.</summary>
public enum PlayerProfileState
{
    /// <summary>Ghost: admin-created, not yet linked to an account.</summary>
    Ghost = 0,
    /// <summary>Claimed/native: linked to an authenticated <c>User</c>.</summary>
    Claimed = 1
}

public enum InvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Revoked = 3,
    Expired = 4
}

public enum CheckInSubjectType
{
    Player = 0,
    Team = 1,
    Captain = 2
}

/// <summary>RF5.2 — category of an automatically detected scheduling conflict.</summary>
public enum ScheduleConflictType
{
    VenueDoubleBooked = 0,
    PlayerDoubleBooked = 1,
    OutsideVenueAvailability = 2
}

public enum ConflictSeverity
{
    Warning = 0,
    Blocking = 1
}
