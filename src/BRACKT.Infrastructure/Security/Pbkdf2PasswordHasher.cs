using System.Security.Cryptography;
using Brackt.Application.Abstractions;

namespace Brackt.Infrastructure.Security;

/// <summary>
/// PBKDF2 (SHA-256) password hasher — no external dependency, constant-time
/// verification. Hash format: "{iterations}.{base64(salt)}.{base64(key)}", which
/// is self-describing so the iteration count can be raised over time without
/// breaking existing hashes.
/// </summary>
public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;
    private static readonly HashAlgorithmName Algo = HashAlgorithmName.SHA256;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algo, KeySize);
        return string.Join('.', Iterations, Convert.ToBase64String(salt), Convert.ToBase64String(key));
    }

    public bool Verify(string password, string hash)
    {
        var parts = hash.Split('.', 3);
        if (parts.Length != 3) return false;
        if (!int.TryParse(parts[0], out var iterations)) return false;

        var salt = Convert.FromBase64String(parts[1]);
        var key = Convert.FromBase64String(parts[2]);
        var attempt = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, Algo, key.Length);
        return CryptographicOperations.FixedTimeEquals(attempt, key);
    }
}
