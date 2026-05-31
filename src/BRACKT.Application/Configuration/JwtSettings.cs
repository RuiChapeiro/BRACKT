namespace Brackt.Application.Configuration;

/// <summary>JWT signing/validation settings, bound from configuration ("Jwt" section).</summary>
public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    /// <summary>Symmetric signing key. MUST be overridden in production via secrets/env.</summary>
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "brackt";
    public string Audience { get; set; } = "brackt-client";
    public int ExpiryMinutes { get; set; } = 120;
}
